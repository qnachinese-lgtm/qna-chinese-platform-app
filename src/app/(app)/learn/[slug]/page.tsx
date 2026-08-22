import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonView } from "./LessonView";
import type { Lesson, LessonToken } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, slug, title_vi, title_trad, title_simp, level, hsk_level, tocfl_level, summary_vi"
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!lesson) notFound();

  const { data: rows } = await supabase
    .from("lesson_tokens")
    .select(
      "id, line_no, seq, speaker, line_vi, punctuation, lexeme:lexemes(*)"
    )
    .eq("lesson_id", lesson.id)
    .order("line_no")
    .order("seq");

  // Thẻ SRS đã có của người dùng → tô màu "đã thuộc"
  const { data: cards } = await supabase
    .from("srs_cards")
    .select("lexeme_id")
    .eq("kind", "recognize");

  const tokens = (rows ?? []).map((r) => ({
    ...r,
    lexeme: Array.isArray(r.lexeme) ? r.lexeme[0] ?? null : r.lexeme,
  })) as unknown as LessonToken[];

  return (
    <LessonView
      lesson={lesson as Lesson}
      tokens={tokens}
      knownIds={(cards ?? []).map((c) => c.lexeme_id as number)}
    />
  );
}
