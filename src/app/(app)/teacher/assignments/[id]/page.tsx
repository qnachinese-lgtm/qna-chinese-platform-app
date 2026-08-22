import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";
import { WritingGrader, type PendingAnswer } from "./WritingGrader";

export const dynamic = "force-dynamic";

interface ProgressRow {
  student_id: string;
  display_name: string | null;
  submission_id: number | null;
  status: string;
  score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  pending_review: number | null;
}

export default async function AssignmentDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const id = Number(params.id);

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, due_at, class_id, instructions_vi")
    .eq("id", id)
    .single();

  if (!assignment) notFound();

  const { data: progress } = await supabase
    .from("assignment_progress")
    .select("*")
    .eq("assignment_id", id)
    .order("display_name");

  const rows = (progress ?? []) as ProgressRow[];

  // Câu viết tay đang chờ chấm
  const submissionIds = rows.map((r) => r.submission_id).filter(Boolean) as number[];
  let pending: PendingAnswer[] = [];

  if (submissionIds.length) {
    const { data } = await supabase
      .from("submission_answers")
      .select(
        "id, response, submission_id, item:assignment_items(prompt_vi, payload)"
      )
      .in("submission_id", submissionIds)
      .eq("needs_review", true);

    const nameBySub = new Map(
      rows.map((r) => [r.submission_id, r.display_name ?? "—"])
    );

    pending = (data ?? []).map((a) => {
      const item = Array.isArray(a.item) ? a.item[0] : a.item;
      return {
        id: a.id as number,
        student: nameBySub.get(a.submission_id as number) ?? "—",
        prompt: (item as any)?.prompt_vi ?? "",
        target: (item as any)?.payload?.target ?? "",
        strokes: (a.response as any)?.strokes ?? null,
      };
    });
  }

  const submitted = rows.filter((r) => r.submitted_at).length;
  const avg =
    rows.filter((r) => r.score != null && r.max_score).length > 0
      ? Math.round(
          (rows
            .filter((r) => r.score != null && r.max_score)
            .reduce((s, r) => s + (r.score! / r.max_score!) * 100, 0) /
            rows.filter((r) => r.score != null && r.max_score).length) * 10
        ) / 10
      : null;

  return (
    <>
      <Toolbar crumb="Tiến độ bài tập" />
      <div className="wrap">
        <div className="eyebrow">Bài tập · 作業</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {assignment.title}
        </h1>
        <p className="lede">{assignment.instructions_vi}</p>

        <div className="kpis" style={{ margin: "22px 0 10px" }}>
          <div className="kpi">
            <div className="l">Đã nộp</div>
            <div className="v">
              {submitted}
              <span style={{ fontSize: 15, color: "var(--text-3)" }}>
                /{rows.length}
              </span>
            </div>
            <div className="d">học viên trong lớp</div>
          </div>
          <div className="kpi">
            <div className="l">Điểm trung bình</div>
            <div className="v">{avg != null ? `${avg}%` : "—"}</div>
            <div className="d">trên các bài đã chấm</div>
          </div>
          <div className="kpi">
            <div className="l">Chờ chấm tay</div>
            <div className="v" style={{ color: pending.length ? "var(--amber)" : undefined }}>
              {pending.length}
            </div>
            <div className="d">câu viết chữ</div>
          </div>
          <div className="kpi">
            <div className="l">Hạn nộp</div>
            <div className="v" style={{ fontSize: 17, fontFamily: "var(--sans)" }}>
              {assignment.due_at
                ? new Date(assignment.due_at).toLocaleDateString("vi-VN")
                : "—"}
            </div>
            <div className="d">
              {assignment.due_at
                ? new Date(assignment.due_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "không đặt hạn"}
            </div>
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Trạng thái</th>
                <th>Điểm</th>
                <th>Nộp lúc</th>
                <th>Chờ chấm</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id}>
                  <td>
                    <b>{r.display_name ?? "—"}</b>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        r.status === "graded"
                          ? "jade"
                          : r.status === "submitted"
                            ? "amber"
                            : "zhu"
                      }`}
                    >
                      {r.status === "graded"
                        ? "đã chấm"
                        : r.status === "submitted"
                          ? "chờ chấm tay"
                          : "chưa nộp"}
                    </span>
                  </td>
                  <td className="num">
                    {r.score != null ? `${r.score}/${r.max_score}` : "—"}
                  </td>
                  <td className="num">
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td className="num">{r.pending_review ?? 0}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-3)" }}>
                    Lớp này chưa có học viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <WritingGrader pending={pending} />
      </div>
    </>
  );
}
