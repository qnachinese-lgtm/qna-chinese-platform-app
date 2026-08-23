"use client";

import Link from "next/link";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";

export interface HwRow {
  id: number;
  title: string;
  instructions_vi: string | null;
  due_at: string | null;
  score: number | null;
  max_score: number | null;
  submitted: boolean;
}

export function HomeworkView({ rows }: { rows: HwRow[] }) {
  const { t, uiLang } = usePrefs();
  const now = Date.now();

  function fmt(d: string | null) {
    if (!d) return uiLang === "zh" ? "無期限" : "không có hạn";
    return new Date(d).toLocaleString(uiLang === "zh" ? "zh-TW" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <Toolbar crumb={t("nav.homework")} />
      <div className="wrap">
        <div className="eyebrow">{t("nav.homework")}</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {t("hw.title")}
        </h1>
        <p className="lede">{t("hw.lede")}</p>

        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {rows.map((a) => {
            const overdue =
              a.due_at && new Date(a.due_at).getTime() < now && !a.submitted;
            return (
              <Link key={a.id} href={`/homework/${a.id}`} className="card">
                <div
                  className="row"
                  style={{ justifyContent: "space-between", alignItems: "start" }}
                >
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{a.title}</h3>
                    {a.instructions_vi && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-2)",
                          marginTop: 4,
                        }}
                      >
                        {a.instructions_vi}
                      </p>
                    )}
                  </div>
                  <span
                    className={`chip ${
                      a.submitted ? "jade" : overdue ? "zhu" : "amber"
                    }`}
                  >
                    {a.submitted
                      ? a.max_score
                        ? `${a.score}/${a.max_score}`
                        : t("hw.status.done")
                      : overdue
                        ? t("hw.status.overdue")
                        : t("hw.status.todo")}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11.5,
                    color: "var(--text-3)",
                    marginTop: 10,
                  }}
                >
                  {t("hw.due")}: {fmt(a.due_at)}
                </p>
              </Link>
            );
          })}

          {rows.length === 0 && <p className="note">{t("hw.none")}</p>}
        </div>
      </div>
    </>
  );
}
