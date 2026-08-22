import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "không có hạn";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HomeworkList() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, instructions_vi, due_at, lesson_id, class_id")
    .eq("published", true)
    .order("due_at", { ascending: true, nullsFirst: false });

  const { data: subs } = await supabase
    .from("submissions")
    .select("assignment_id, status, score, max_score, submitted_at")
    .eq("student_id", user!.id);

  const byAssignment = new Map(
    (subs ?? []).map((s) => [s.assignment_id as number, s])
  );

  const now = Date.now();

  return (
    <>
      <Toolbar crumb="Bài tập" />
      <div className="wrap">
        <div className="eyebrow">Bài tập · 作業</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          Bài tập của bạn
        </h1>
        <p className="lede">
          Làm xong nộp là chấm ngay. Câu nào sai thì từ trong câu đó tự động vào
          hàng đợi ôn tập của bạn — không cần tự ghi lại.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {(assignments ?? []).map((a) => {
            const s = byAssignment.get(a.id);
            const overdue =
              a.due_at && new Date(a.due_at).getTime() < now && !s?.submitted_at;
            const done = s?.status === "graded" || s?.status === "submitted";
            return (
              <Link key={a.id} href={`/homework/${a.id}`} className="card">
                <div
                  className="row"
                  style={{ justifyContent: "space-between", alignItems: "start" }}
                >
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{a.title}</h3>
                    {a.instructions_vi && (
                      <p
                        style={{
                          fontSize: 13, color: "var(--text-2)", marginTop: 4,
                        }}
                      >
                        {a.instructions_vi}
                      </p>
                    )}
                  </div>
                  <span
                    className={`chip ${
                      done ? "jade" : overdue ? "zhu" : "amber"
                    }`}
                  >
                    {done
                      ? s?.max_score
                        ? `${s.score}/${s.max_score}`
                        : "đã nộp"
                      : overdue
                        ? "quá hạn"
                        : "chưa làm"}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--mono)", fontSize: 11.5,
                    color: "var(--text-3)", marginTop: 10,
                  }}
                >
                  Hạn nộp: {fmt(a.due_at)}
                </p>
              </Link>
            );
          })}

          {(!assignments || assignments.length === 0) && (
            <p className="note">
              Chưa có bài tập nào. Giáo viên giao bài xong sẽ hiện ở đây.
              <br />
              尚無作業。老師指派後會出現在這裡。
            </p>
          )}
        </div>
      </div>
    </>
  );
}
