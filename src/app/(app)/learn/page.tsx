import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";

export const dynamic = "force-dynamic";

const LEVELS = [
  { n: 1, vi: "Bậc 1", hsk: "HSK 1", words: 500, cefr: "A1" },
  { n: 2, vi: "Bậc 2", hsk: "HSK 2", words: 1272, cefr: "A2" },
  { n: 3, vi: "Bậc 3", hsk: "HSK 3", words: 2245, cefr: "A2–B1" },
  { n: 4, vi: "Bậc 4", hsk: "HSK 4", words: 3245, cefr: "B1" },
  { n: 5, vi: "Bậc 5", hsk: "HSK 5", words: 4316, cefr: "B2" },
  { n: 6, vi: "Bậc 6", hsk: "HSK 6", words: 5456, cefr: "B2–C1" },
  { n: 7, vi: "Văn ngôn W1", hsk: "—", words: 0, cefr: "—" },
  { n: 8, vi: "Văn ngôn W2", hsk: "—", words: 0, cefr: "—" },
  { n: 9, vi: "Văn ngôn W3", hsk: "—", words: 0, cefr: "—" },
];

export default async function LearnIndex() {
  const supabase = createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, slug, title_vi, title_trad, summary_vi, level, hsk_level")
    .eq("status", "published")
    .order("sort_order");

  const byLevel = new Map<number, typeof lessons>();
  (lessons ?? []).forEach((l) => {
    const arr = byLevel.get(l.level) ?? [];
    arr.push(l);
    byLevel.set(l.level, arr as typeof lessons);
  });

  return (
    <>
      <Toolbar crumb="Lộ trình học" />
      <div className="wrap">
        <div className="eyebrow">Lộ trình · 學習路徑</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          Từ vỡ lòng đến văn ngôn
        </h1>
        <p className="lede">
          Khung cấp độ bám theo <b>HSK 3.0</b> (số liệu chính thức của Chuẩn
          trình độ tiếng Trung quốc tế, GF 0025-2021) và có cột đối chiếu TOCFL
          cho người Việt đang ở Đài Loan.
        </p>

        <div className="tablewrap" style={{ marginTop: 22 }}>
          <table>
            <thead>
              <tr>
                <th>Bậc</th>
                <th>HSK 3.0</th>
                <th>Từ vựng tích lũy</th>
                <th>CEFR (tham khảo)</th>
                <th>Bài học</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lv) => {
                const items = byLevel.get(lv.n) ?? [];
                return (
                  <tr key={lv.n}>
                    <td>
                      <b>{lv.vi}</b>
                    </td>
                    <td className="num">{lv.hsk}</td>
                    <td className="num">{lv.words || "—"}</td>
                    <td className="num">{lv.cefr}</td>
                    <td>
                      {items.length ? (
                        items.map((l) => (
                          <Link
                            key={l.id}
                            href={`/learn/${l.slug}`}
                            style={{
                              color: "var(--zhu)",
                              fontWeight: 600,
                              display: "block",
                            }}
                          >
                            {l.title_vi} · {l.title_trad}
                          </Link>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>
                          đang biên soạn
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="note">
          Cột CEFR chỉ là <b>đối chiếu tham khảo của QNA</b>. HSK không có bảng
          quy đổi CEFR chính thức, và giữa HSK với TOCFL cũng không có thỏa thuận
          công nhận lẫn nhau. Ghi rõ điều này để học viên không chọn nhầm kỳ thi.
          <br />
          CEFR 一欄屬本站參考對齊，非官方互認。
        </p>
      </div>
    </>
  );
}
