"use client";

import Link from "next/link";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";
import { levelLabel } from "@/lib/i18n";

export interface LearnLesson {
  id: number;
  slug: string;
  title_vi: string;
  title_trad: string;
  title_simp: string;
  summary_vi: string | null;
  level: number;
  hsk_level: number | null;
  tocfl_level: string | null;
}

/**
 * Khung cấp độ / 等級架構
 * Bậc 1–6 bám HSK 3.0 (GF 0025-2021); W1–W3 là văn ngôn của riêng QNA.
 * 一到六級對齊 HSK 3.0，W1–W3 是本站的文言文分級。
 */
const LEVELS = [
  { n: 1, hsk: "HSK 1", tocfl: "準備級 1", words: 500, cefr: "A1" },
  { n: 2, hsk: "HSK 2", tocfl: "準備級 2", words: 1272, cefr: "A2" },
  { n: 3, hsk: "HSK 3", tocfl: "入門級 3", words: 2245, cefr: "A2–B1" },
  { n: 4, hsk: "HSK 4", tocfl: "基礎級 4", words: 3245, cefr: "B1" },
  { n: 5, hsk: "HSK 5", tocfl: "進階級 5", words: 4316, cefr: "B2" },
  { n: 6, hsk: "HSK 6", tocfl: "高階級 6", words: 5456, cefr: "B2–C1" },
  { n: 7, hsk: "—", tocfl: "文言 W1", words: 0, cefr: "—" },
  { n: 8, hsk: "—", tocfl: "文言 W2", words: 0, cefr: "—" },
  { n: 9, hsk: "—", tocfl: "文言 W3", words: 0, cefr: "—" },
];

export function LearnView({
  level,
  tocflLevel,
  levelSource,
  lessons,
  locked,
  allowedLessonIds,
}: {
  level: number;
  tocflLevel: string | null;
  levelSource: string;
  lessons: LearnLesson[];
  locked: boolean;
  allowedLessonIds: number[] | null;
}) {
  const { t, uiLang, script } = usePrefs();

  const allow = allowedLessonIds ? new Set(allowedLessonIds) : null;
  const visible = allow ? lessons.filter((l) => allow.has(l.id)) : lessons;

  const byLevel = new Map<number, LearnLesson[]>();
  visible.forEach((l) => {
    const arr = byLevel.get(l.level) ?? [];
    arr.push(l);
    byLevel.set(l.level, arr);
  });

  const sourceKey =
    levelSource === "teacher"
      ? "learn.source.teacher"
      : levelSource === "test"
        ? "learn.source.test"
        : "learn.source.default";

  return (
    <>
      <Toolbar crumb={t("nav.learn")} />
      <div className="wrap">
        <div className="eyebrow">{t("nav.learn")}</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {t("learn.title")}
        </h1>

        <div className="row" style={{ gap: 8, margin: "0 0 14px" }}>
          <span className="chip zhu">
            {t("learn.yourlevel")}: {tocflLevel ?? levelLabel(level, uiLang)}
          </span>
          <span className="chip">{t(sourceKey)}</span>
          {levelSource === "default" && (
            <Link href="/placement" className="chip amber">
              {t("dash.placement.cta")} →
            </Link>
          )}
        </div>

        <p className="lede">{t("learn.lede")}</p>

        {locked && (
          <p
            className="note"
            style={{
              borderColor: "var(--zhu-edge)",
              background: "var(--zhu-wash)",
              marginTop: 16,
            }}
          >
            {t("learn.locked")}
          </p>
        )}

        <div className="tablewrap" style={{ marginTop: 22 }}>
          <table>
            <thead>
              <tr>
                <th>{t("learn.col.level")}</th>
                <th>HSK 3.0</th>
                <th>TOCFL</th>
                <th>{t("learn.col.words")}</th>
                <th>CEFR</th>
                <th>{t("learn.col.lessons")}</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lv) => {
                const items = byLevel.get(lv.n) ?? [];
                const suitable = lv.n <= level;
                const current = lv.n === level;
                return (
                  <tr
                    key={lv.n}
                    style={
                      current
                        ? { background: "var(--zhu-wash)" }
                        : suitable
                          ? undefined
                          : { opacity: 0.55 }
                    }
                  >
                    <td>
                      <b>
                        {uiLang === "zh" ? `第 ${lv.n} 級` : `Bậc ${lv.n}`}
                      </b>
                      {current && (
                        <span className="chip zhu" style={{ marginLeft: 8 }}>
                          {t("learn.here")}
                        </span>
                      )}
                    </td>
                    <td className="num">{lv.hsk}</td>
                    <td className="num">{lv.tocfl}</td>
                    <td className="num">{lv.words || "—"}</td>
                    <td className="num">{lv.cefr}</td>
                    <td>
                      {items.length ? (
                        items.map((l) => (
                          <Link
                            key={l.id}
                            href={`/learn/${l.slug}`}
                            style={{
                              color: suitable ? "var(--zhu)" : "var(--text-3)",
                              fontWeight: 600,
                              display: "block",
                              padding: "2px 0",
                            }}
                          >
                            {l.title_vi} ·{" "}
                            {script === "trad" ? l.title_trad : l.title_simp}
                            {!suitable && (
                              <span
                                className="chip amber"
                                style={{ marginLeft: 8, fontWeight: 500 }}
                              >
                                {t("learn.tooadvanced")}
                              </span>
                            )}
                          </Link>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>
                          {t("learn.editing")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="note">{t("learn.cefrnote")}</p>
      </div>
    </>
  );
}
