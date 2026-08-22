import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateItems, type ExerciseKind } from "@/lib/exercises";
import type { Lexeme, LessonToken } from "@/lib/types";

/**
 * Sinh đề tự động cho một bài học / 依課程自動出題
 *
 * Chạy ở phía máy chủ bằng chính phiên đăng nhập của giáo viên, nên RLS
 * vẫn áp dụng: chỉ giáo viên sở hữu lớp mới ghi được vào assignments.
 * 用老師自己的 session 在伺服器端跑，RLS 照常生效。
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await request.json();
  const {
    class_id,
    lesson_id,
    title,
    instructions_vi,
    due_at,
    counts,
  }: {
    class_id: number;
    lesson_id: number;
    title?: string;
    instructions_vi?: string;
    due_at?: string | null;
    counts?: Partial<Record<ExerciseKind, number>>;
  } = body;

  if (!class_id || !lesson_id) {
    return NextResponse.json(
      { error: "Thiếu class_id hoặc lesson_id" },
      { status: 400 }
    );
  }

  // 1) Lấy hội thoại + từ vựng của bài học
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title_vi")
    .eq("id", lesson_id)
    .single();

  const { data: rows, error: tokErr } = await supabase
    .from("lesson_tokens")
    .select("id, line_no, seq, speaker, line_vi, punctuation, lexeme:lexemes(*)")
    .eq("lesson_id", lesson_id)
    .order("line_no")
    .order("seq");

  if (tokErr) {
    return NextResponse.json({ error: tokErr.message }, { status: 400 });
  }

  const tokens = (rows ?? []).map((r) => ({
    ...r,
    lexeme: Array.isArray(r.lexeme) ? (r.lexeme[0] ?? null) : r.lexeme,
  })) as unknown as LessonToken[];

  const lexemes: Lexeme[] = [];
  const seen = new Set<number>();
  tokens.forEach((t) => {
    if (t.lexeme && !seen.has(t.lexeme.id)) {
      seen.add(t.lexeme.id);
      lexemes.push(t.lexeme);
    }
  });

  if (lexemes.length < 4) {
    return NextResponse.json(
      { error: "Bài học này có quá ít từ vựng để sinh đề (cần ít nhất 4 từ)." },
      { status: 400 }
    );
  }

  const generated = generateItems(lexemes, tokens, { counts });
  if (generated.length === 0) {
    return NextResponse.json({ error: "Không sinh được câu hỏi nào." }, { status: 400 });
  }

  // 2) Tạo assignment
  const { data: assignment, error: aErr } = await supabase
    .from("assignments")
    .insert({
      class_id,
      lesson_id,
      title: title?.trim() || `Bài tập: ${lesson?.title_vi ?? "bài học"}`,
      instructions_vi:
        instructions_vi?.trim() ||
        "Làm hết các câu rồi bấm Nộp bài. Câu sai sẽ tự động vào hàng đợi ôn tập.",
      due_at: due_at || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (aErr || !assignment) {
    return NextResponse.json(
      { error: aErr?.message ?? "Không tạo được bài tập" },
      { status: 400 }
    );
  }

  // 3) Chèn đề bài (học viên đọc được)
  const { data: items, error: iErr } = await supabase
    .from("assignment_items")
    .insert(
      generated.map((g, n) => ({
        assignment_id: assignment.id,
        seq: n + 1,
        kind: g.kind,
        prompt_vi: g.prompt_vi,
        payload: g.payload,
        lexeme_id: g.lexeme_id,
        points: g.points,
        auto_graded: g.auto_graded,
      }))
    )
    .select("id, seq");

  if (iErr || !items) {
    // Dọn dẹp để không để lại bài tập rỗng
    await supabase.from("assignments").delete().eq("id", assignment.id);
    return NextResponse.json(
      { error: iErr?.message ?? "Không tạo được câu hỏi" },
      { status: 400 }
    );
  }

  // 4) Chèn đáp án vào bảng riêng (học viên KHÔNG đọc được)
  const bySeq = new Map(items.map((it) => [it.seq as number, it.id as number]));
  const { error: kErr } = await supabase.from("assignment_keys").insert(
    generated.map((g, n) => ({
      item_id: bySeq.get(n + 1)!,
      answer: g.answer,
      explain_vi: g.explain_vi,
      explain_zh: g.explain_zh,
    }))
  );

  if (kErr) {
    await supabase.from("assignments").delete().eq("id", assignment.id);
    return NextResponse.json({ error: kErr.message }, { status: 400 });
  }

  return NextResponse.json({
    assignment_id: assignment.id,
    item_count: generated.length,
  });
}
