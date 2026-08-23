"use client";

import Link from "next/link";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";
import { levelLabel } from "@/lib/i18n";

export interface DashLesson {
  id: number;
  slug: string;
  title_vi: string;
  title_trad: string;
  title_simp: string;
  level: number;
  hsk_level: number | null;
  tocfl_level: string | null;
}

export function DashboardView({
  name,
  level,
  tocflLevel,
  levelSource,
  streak,
  dueCount,
  cardCount,
  lessons,
}: {
  name: string | null;
  level: number;
  tocflLevel: string | null;
  levelSource: string;
  streak: number;
  dueCount: number;
  cardCount: number;
  lessons: DashLesson[];
}) {
  const { t, uiLang, script } = usePrefs();
  const notPlaced = levelSource === "default";

  // Bài phù hợp = cấp bằng hoặc thấp hơn cấp của học viên.
  // 適合的課 = 等級小於等於學生等級。
  const suitable = lessons.filter((l) => l.level <= level);
  const advanced = lessons.filter((l) => l.level > level);

  const sourceKey =
    levelSource === "teacher"
      ? "learn.source.teacher"
      : levelSource === "test"
        ? "learn.source.test"
        : "learn.source.default";

  return (
    <>
      <Toolbar crumb={t("nav.dashboard")} />
      <div className="wrap">
        <div className="eyebrow">{t("dash.hello")}</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {name ?? "—"}
        </h1>
        <p className="lede">{t("dash.lede")}</p>

        {notPlaced && (
          <div
            className="card"
            style={{
              marginTop: 20,
              borderColor: "var(--zhu-edge)",
              background: "var(--zhu-wash)",
              maxWidth: 720,
            }}
          >
            <div className="eyebrow">{t("nav.placement")}</div>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: "8px 0 14px" }}>
              {t("dash.placement.why")}
            </p>
            <Link href="/placement" className="btn">
              {t("dash.placement.cta")} →
            </Link>
          </div>
        )}

        <div className="kpis" style={{ margin: "22px 0 10px" }}>
          <div className="kpi">
            <div className="l">{t("dash.level")}</div>
            <div className="v" style={{ fontSize: 20, fontFamily: "var(--sans)" }}>
              {tocflLevel ?? levelLabel(level, uiLang)}
            </div>
            <div className="d">{t(sourceKey)}</div>
          </div>
          <div className="kpi">
            <div className="l">{t("dash.due")}</div>
            <div className="v" style={{ color: dueCount ? "var(--zhu)" : undefined }}>
              {dueCount}
            </div>
            <div className="d">{t("dash.due.sub")}</div>
          </div>
          <div className="kpi">
            <div className="l">{t("dash.cards")}</div>
            <div className="v">{cardCount}</div>
            <div className="d">{t("dash.cards.sub")}</div>
          </div>
          <div className="kpi">
            <div className="l">{t("dash.streak")}</div>
            <div className="v">{streak}</div>
            <div className="d">{t("dash.streak.sub")}</div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <Link href="/review" className="btn">
            {t("dash.review.cta")} →
          </Link>
          <Link href="/homework" className="btn ghost">
            {t("nav.homework")}
          </Link>
          <Link href="/learn" className="btn ghost">
            {t("nav.learn")}
          </Link>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "36px 0 12px" }}>
          {t("dash.lessons")}
        </h2>

        <div className="grid3">
          {suitable.map((l) => (
            <LessonCard key={l.id} lesson={l} script={script} suitable />
          ))}
          {suitable.length === 0 && advanced.length === 0 && (
            <p className="note">{t("dash.nolessons")}</p>
          )}
          {suitable.length === 0 && advanced.length > 0 && (
            <p className="note" style={{ gridColumn: "1 / -1" }}>
              {t("learn.tooadvanced")} — {t("dash.placement.why")}
            </p>
          )}
        </div>

        {advanced.length > 0 && (
          <>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: "30px 0 10px",
                color: "var(--text-3)",
              }}
            >
              {t("learn.tooadvanced")}
            </h2>
            <div className="grid3">
              {advanced.map((l) => (
                <LessonCard key={l.id} lesson={l} script={script} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function LessonCard({
  lesson,
  script,
  suitable,
}: {
  lesson: DashLesson;
  script: "trad" | "simp";
  suitable?: boolean;
}) {
  const { t } = usePrefs();
  return (
    <Link
      href={`/learn/${lesson.slug}`}
      className="card"
      style={suitable ? undefined : { opacity: 0.62 }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className={`chip ${suitable ? "jade" : "amber"}`}>
          {suitable ? t("learn.suitable") : t("learn.tooadvanced")}
        </span>
        <span className="chip">
          {lesson.tocfl_level ?? `HSK ${lesson.hsk_level ?? "—"}`}
        </span>
      </div>
      <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "10px 0 4px" }}>
        {lesson.title_vi}
      </h3>
      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--text-3)" }}>
        {script === "trad" ? lesson.title_trad : lesson.title_simp}
      </p>
    </Link>
  );
}
