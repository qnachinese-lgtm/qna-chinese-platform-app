import { createClient } from "@/lib/supabase/server";
import { TeacherView, type RosterRow, type TeacherClass } from "./TeacherView";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const supabase = createClient();

  const [{ data: classes }, { data: roster }] = await Promise.all([
    supabase.from("classes").select("id, name, code, lock_to_assigned"),
    supabase.from("class_roster").select("*").order("display_name"),
  ]);

  return (
    <TeacherView
      classes={(classes ?? []) as TeacherClass[]}
      roster={(roster ?? []) as RosterRow[]}
    />
  );
}
