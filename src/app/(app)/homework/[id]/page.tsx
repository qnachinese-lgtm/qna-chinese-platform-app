import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Runner } from "./Runner";
import type { AssignmentItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomeworkPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const assignmentId = Number(params.id);

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, instructions_vi, due_at")
    .eq("id", assignmentId)
    .single();

  if (!assignment) notFound();

  // Mở (hoặc lấy lại) bài làm — hàm này cũng kiểm tra bạn có ở trong lớp không.
  const { data: submissionId, error: startErr } = await supabase.rpc(
    "start_submission",
    { a_id: assignmentId }
  );

  if (startErr || !submissionId) {
    return (
      <div className="wrap">
        <p className="note">
          Không mở được bài tập này: {startErr?.message ?? "không rõ lý do"}
        </p>
      </div>
    );
  }

  const [{ data: items }, { data: sub }, { data: answers }] = await Promise.all([
    supabase
      .from("assignment_items")
      .select("id, seq, kind, prompt_vi, payload, points, auto_graded")
      .eq("assignment_id", assignmentId)
      .order("seq"),
    supabase
      .from("submissions")
      .select("id, status, score, max_score")
      .eq("id", submissionId)
      .single(),
    supabase
      .from("submission_answers")
      .select("item_id, response")
      .eq("submission_id", submissionId),
  ]);

  const initial: Record<number, any> = {};
  (answers ?? []).forEach((a) => {
    initial[a.item_id as number] = a.response;
  });

  return (
    <Runner
      assignment={assignment}
      submissionId={submissionId as number}
      alreadySubmitted={sub?.status !== "in_progress"}
      items={(items ?? []) as AssignmentItem[]}
      initial={initial}
    />
  );
}
