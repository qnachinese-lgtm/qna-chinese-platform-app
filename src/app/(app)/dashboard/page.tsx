import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashLesson } from "./DashboardView";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { count: dueCount }, { count: cardCount }, { data: lessons }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, current_level, tocfl_level, level_source, streak_days")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("srs_cards")
        .select("id", { count: "exact", head: true })
        .lte("due", today),
      supabase.from("srs_cards").select("id", { count: "exact", head: true }),
      supabase
        .from("lessons")
        .select("id, slug, title_vi, title_trad, title_simp, level, hsk_level, tocfl_level")
        .eq("status", "published")
        .order("sort_order"),
    ]);

  return (
    <DashboardView
      name={profile?.display_name ?? null}
      level={profile?.current_level ?? 1}
      tocflLevel={profile?.tocfl_level ?? null}
      levelSource={(profile?.level_source as string) ?? "default"}
      streak={profile?.streak_days ?? 0}
      dueCount={dueCount ?? 0}
      cardCount={cardCount ?? 0}
      lessons={(lessons ?? []) as DashLesson[]}
    />
  );
}
