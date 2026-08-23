import { createClient } from "@/lib/supabase/server";
import { PlacementTest, type PaperQuestion } from "./PlacementTest";

export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: paper }, { data: profile }, { data: lastAttempt }] =
    await Promise.all([
      supabase
        .from("placement_paper")
        .select("*")
        .order("band")
        .order("seq"),
      supabase
        .from("profiles")
        .select("current_level, tocfl_level, level_source, placed_at")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("placement_attempts")
        .select("id, finished_at, raw_score, max_score, level_result, tocfl_result, band_scores")
        .eq("user_id", user!.id)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return (
    <PlacementTest
      paper={(paper ?? []) as PaperQuestion[]}
      levelSource={(profile?.level_source as string) ?? "default"}
      currentTocfl={profile?.tocfl_level ?? null}
      lastAttempt={lastAttempt ?? null}
    />
  );
}
