import { createClient } from "@/lib/supabase/server";
import { ReviewSession, type DueCard } from "./ReviewSession";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("srs_cards")
    .select(
      "id, kind, due, stability, difficulty, reps, lapses, lexeme:lexemes(*)"
    )
    .lte("due", today)
    .order("due")
    .limit(60);

  const cards = (data ?? []).map((c) => ({
    ...c,
    lexeme: Array.isArray(c.lexeme) ? c.lexeme[0] : c.lexeme,
  })) as unknown as DueCard[];

  return <ReviewSession cards={cards} />;
}
