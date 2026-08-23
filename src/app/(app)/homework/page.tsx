import { createClient } from "@/lib/supabase/server";
import { HomeworkView, type HwRow } from "./HomeworkView";

export const dynamic = "force-dynamic";

export default async function HomeworkList() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: assignments }, { data: subs }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, instructions_vi, due_at, lesson_id, class_id")
      .eq("published", true)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("submissions")
      .select("assignment_id, status, score, max_score, submitted_at")
      .eq("student_id", user!.id),
  ]);

  const byAssignment = new Map(
    (subs ?? []).map((s) => [s.assignment_id as number, s])
  );

  const rows: HwRow[] = (assignments ?? []).map((a) => {
    const s = byAssignment.get(a.id);
    return {
      id: a.id,
      title: a.title,
      instructions_vi: a.instructions_vi,
      due_at: a.due_at,
      score: s?.score ?? null,
      max_score: s?.max_score ?? null,
      submitted: s?.status === "graded" || s?.status === "submitted",
    };
  });

  return <HomeworkView rows={rows} />;
}
