import { createClient } from "@/lib/supabase/server";
import { LearnView, type LearnLesson } from "./LearnView";

export const dynamic = "force-dynamic";

export default async function LearnIndex() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: lessons }, { data: enrolled }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("current_level, tocfl_level, level_source")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("lessons")
        .select(
          "id, slug, title_vi, title_trad, title_simp, summary_vi, level, hsk_level, tocfl_level"
        )
        .eq("status", "published")
        .order("sort_order"),
      // Lớp của học viên — để biết lớp có bật chế độ "chỉ học bài được giao" không.
      // 學生所屬班級——用來判斷是否開了「只能上指派的課」。
      supabase
        .from("enrollments")
        .select("class_id, classes(lock_to_assigned)")
        .eq("student_id", user!.id),
    ]);

  const rows = (enrolled ?? []) as Array<{
    class_id: number;
    classes: { lock_to_assigned: boolean } | { lock_to_assigned: boolean }[] | null;
  }>;

  const lockedClassIds = rows
    .filter((r) => {
      const c = Array.isArray(r.classes) ? r.classes[0] : r.classes;
      return c?.lock_to_assigned === true;
    })
    .map((r) => r.class_id);

  // Chỉ khi MỌI lớp của học viên đều bật khoá thì mới thực sự khoá.
  // 只有當學生所有班級都開了鎖，才真的鎖。
  const locked = rows.length > 0 && lockedClassIds.length === rows.length;

  let allowed: number[] | null = null;
  if (locked) {
    const { data: assigned } = await supabase
      .from("assignments")
      .select("lesson_id")
      .in("class_id", lockedClassIds)
      .eq("published", true)
      .not("lesson_id", "is", null);
    allowed = Array.from(
      new Set((assigned ?? []).map((a) => a.lesson_id as number))
    );
  }

  return (
    <LearnView
      level={profile?.current_level ?? 1}
      tocflLevel={profile?.tocfl_level ?? null}
      levelSource={(profile?.level_source as string) ?? "default"}
      lessons={(lessons ?? []) as LearnLesson[]}
      locked={locked}
      allowedLessonIds={allowed}
    />
  );
}
