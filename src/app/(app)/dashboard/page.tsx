import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: dueCount }, { count: knownCount }, { data: lessons }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, current_level, streak_days")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("srs_cards")
        .select("id", { count: "exact", head: true })
        .lte("due", new Date().toISOString().slice(0, 10)),
      supabase.from("srs_cards").select("id", { count: "exact", head: true }),
      supabase
        .from("lessons")
        .select("id, slug, title_vi, title_trad, level, hsk_level")
        .eq("status", "published")
        .order("sort_order")
        .limit(4),
    ]);

  return (
    <>
      <Toolbar crumb="Bảng điều khiển" />
      <div className="wrap">
        <div className="eyebrow">Xin chào</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {profile?.display_name ?? "Học viên"}
        </h1>
        <p className="lede">
          Tiến độ của bạn được lưu trên máy chủ. Đổi máy hay quay lại sau vài
          tháng, hàng đợi ôn tập vẫn còn nguyên.
        </p>

        <div className="kpis" style={{ margin: "22px 0 10px" }}>
          <div className="kpi">
            <div className="l">Đến hạn ôn</div>
            <div className="v" style={{ color: dueCount ? "var(--zhu)" : undefined }}>
              {dueCount ?? 0}
            </div>
            <div className="d">thẻ cần ôn hôm nay</div>
          </div>
          <div className="kpi">
            <div className="l">Tổng số thẻ</div>
            <div className="v">{knownCount ?? 0}</div>
            <div className="d">từ đã đưa vào ôn tập</div>
          </div>
          <div className="kpi">
            <div className="l">Bậc hiện tại</div>
            <div className="v">{profile?.current_level ?? 1}</div>
            <div className="d">HSK {profile?.current_level ?? 1}</div>
          </div>
          <div className="kpi">
            <div className="l">Chuỗi ngày</div>
            <div className="v">{profile?.streak_days ?? 0}</div>
            <div className="d">ngày học liên tiếp</div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <Link href="/review" className="btn">
            Ôn tập ngay →
          </Link>
          <Link href="/homework" className="btn ghost">
            Bài tập
          </Link>
          <Link href="/learn" className="btn ghost">
            Xem lộ trình học
          </Link>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "36px 0 12px" }}>
          Bài học
        </h2>
        <div className="grid3">
          {(lessons ?? []).map((l) => (
            <Link key={l.id} href={`/learn/${l.slug}`} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="chip zhu">Bậc {l.level}</span>
                <span className="chip">HSK {l.hsk_level ?? "—"}</span>
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "10px 0 4px" }}>
                {l.title_vi}
              </h3>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  color: "var(--text-3)",
                }}
              >
                {l.title_trad}
              </p>
            </Link>
          ))}
          {(!lessons || lessons.length === 0) && (
            <p className="note">
              Chưa có bài học nào. Chạy <code>supabase/seed.sql</code> để nạp dữ
              liệu mẫu. / 尚無課程，請先執行 seed.sql。
            </p>
          )}
        </div>
      </div>
    </>
  );
}
