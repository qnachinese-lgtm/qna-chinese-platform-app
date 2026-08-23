"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";
import { createClient } from "@/lib/supabase/client";

export interface PaperQuestion {
  id: number;
  band: number;
  tocfl_band: string;
  seq: number;
  kind: string;
  prompt_vi: string;
  prompt_zh: string;
  stem_trad: string | null;
  stem_simp: string | null;
  options_vi: string[];
}

interface Attempt {
  id: number;
  finished_at: string | null;
  raw_score: number | null;
  max_score: number | null;
  level_result: number | null;
  tocfl_result: string | null;
  band_scores: Record<string, number> | null;
}

const BANDS = ["準備級", "入門級", "基礎級", "進階級"];

export function PlacementTest({
  paper,
  levelSource,
  currentTocfl,
  lastAttempt,
}: {
  paper: PaperQuestion[];
  levelSource: string;
  currentTocfl: string | null;
  lastAttempt: Attempt | null;
}) {
  const { t, uiLang, script } = usePrefs();
  const router = useRouter();

  const [phase, setPhase] = useState<"intro" | "running" | "done">(
    lastAttempt ? "done" : "intro"
  );
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Attempt | null>(lastAttempt);

  const q = paper[i];
  const answered = Object.keys(answers).length;

  async function begin() {
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("start_placement");
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setAttemptId(data as number);
    setAnswers({});
    setI(0);
    setPhase("running");
  }

  async function choose(choice: number) {
    if (!q || !attemptId) return;
    setAnswers((a) => ({ ...a, [q.id]: choice }));
    const supabase = createClient();
    await supabase
      .from("placement_answers")
      .upsert(
        { attempt_id: attemptId, question_id: q.id, choice },
        { onConflict: "attempt_id,question_id" }
      );
  }

  async function submit() {
    if (!attemptId) return;
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("grade_placement", {
      a_id: attemptId,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as any;
    setResult({
      id: attemptId,
      finished_at: new Date().toISOString(),
      raw_score: row.raw_score,
      max_score: row.max_score,
      level_result: row.level_result,
      tocfl_result: row.tocfl_result,
      band_scores: row.band_scores,
    });
    setPhase("done");
    router.refresh();
  }

  /* ── màn hình giới thiệu / 說明畫面 ── */
  if (phase === "intro" || (phase === "done" && !result)) {
    return (
      <>
        <Toolbar crumb={t("nav.placement")} />
        <div className="wrap">
          <div className="eyebrow">TOCFL</div>
          <h1 className="h1" style={{ margin: "10px 0 12px" }}>
            {t("pl.title")}
          </h1>
          <div className="card" style={{ maxWidth: 640, marginTop: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t("pl.intro.h")}</h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-2)",
                margin: "10px 0 18px",
                lineHeight: 1.8,
              }}
            >
              {t("pl.intro.body")}
            </p>
            <div className="row" style={{ gap: 6, marginBottom: 18 }}>
              {BANDS.map((b, n) => (
                <span key={b} className="chip">
                  {n + 1}. {b}
                </span>
              ))}
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn" onClick={begin} disabled={busy || !paper.length}>
              {busy ? t("common.loading") : t("pl.start")} →
            </button>
            {!paper.length && (
              <p className="note" style={{ marginBottom: 0 }}>
                Chưa nạp ngân hàng đề. Chạy supabase/v2-placement-i18n.sql.
                <br />
                題庫尚未匯入，請先執行 v2-placement-i18n.sql。
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ── kết quả / 結果 ── */
  if (phase === "done" && result) {
    const bs = result.band_scores ?? {};
    return (
      <>
        <Toolbar crumb={t("nav.placement")} />
        <div className="wrap">
          <div className="eyebrow">{t("pl.result.h")}</div>
          <h1 className="h1" style={{ margin: "10px 0 18px" }}>
            {result.tocfl_result ?? currentTocfl ?? "—"}
          </h1>

          <div className="kpis" style={{ maxWidth: 720 }}>
            <div className="kpi">
              <div className="l">{t("pl.result.level")}</div>
              <div className="v" style={{ fontSize: 22, fontFamily: "var(--sans)" }}>
                {result.tocfl_result ?? "—"}
              </div>
              <div className="d">
                {levelSource === "teacher" ? t("learn.source.teacher") : t("learn.source.test")}
              </div>
            </div>
            <div className="kpi">
              <div className="l">{t("pl.result.score")}</div>
              <div className="v">
                {result.raw_score ?? 0}
                <span style={{ fontSize: 16, color: "var(--text-3)" }}>
                  /{result.max_score ?? 0}
                </span>
              </div>
              <div className="d">{t("pl.result.byband")}</div>
            </div>
          </div>

          <div className="tablewrap" style={{ maxWidth: 720 }}>
            <table>
              <thead>
                <tr>
                  <th>TOCFL</th>
                  <th>{t("pl.result.score")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {BANDS.map((b, n) => {
                  const hit = bs[String(n)] ?? 0;
                  const pass = hit * 3 >= 6 * 2;
                  return (
                    <tr key={b}>
                      <td>
                        <b>{b}</b>
                      </td>
                      <td className="num">{hit} / 6</td>
                      <td>
                        <span className={`chip ${pass ? "jade" : ""}`}>
                          {pass ? "✓" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="note" style={{ maxWidth: 720 }}>
            {t("pl.result.note")}
          </p>

          <div className="row" style={{ marginTop: 18 }}>
            <Link href="/learn" className="btn">
              {t("pl.result.next")} →
            </Link>
            <button className="btn ghost" onClick={begin} disabled={busy}>
              {t("pl.retake")}
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── đang làm bài / 作答中 ── */
  return (
    <>
      <Toolbar crumb={t("nav.placement")} />
      <div className="wrap">
        <div className="qhead">
          <div>
            <div className="eyebrow">
              {q.tocfl_band} · {t("pl.question")} {i + 1} {t("pl.of")} {paper.length}
            </div>
            <h1 className="h1" style={{ marginTop: 8, fontSize: 22 }}>
              {uiLang === "zh" ? q.prompt_zh : q.prompt_vi}
            </h1>
          </div>
          <span className="chip">
            {answered} / {paper.length}
          </span>
        </div>

        <div className="qbar">
          {paper.map((x, n) => (
            <button
              key={x.id}
              className="qdot"
              aria-label={`${n + 1}`}
              data-current={n === i || undefined}
              data-done={answers[x.id] !== undefined || undefined}
              onClick={() => setI(n)}
            />
          ))}
        </div>

        <div className="card" style={{ maxWidth: 680 }}>
          {q.stem_trad && (
            <div className="bigword" style={{ marginBottom: 16 }}>
              {script === "trad" ? q.stem_trad : q.stem_simp ?? q.stem_trad}
            </div>
          )}
          <div className="optlist">
            {q.options_vi.map((o, n) => (
              <button
                key={n}
                className="opt"
                style={
                  answers[q.id] === n
                    ? { borderColor: "var(--zhu)", background: "var(--zhu-wash)" }
                    : undefined
                }
                onClick={() => choose(n)}
              >
                <span className="k">{"ABCD"[n]}</span>
                <span>{o}</span>
              </button>
            ))}
          </div>
        </div>

        {err && <p className="err">{err}</p>}

        <div className="row" style={{ marginTop: 18 }}>
          <button
            className="btn ghost"
            disabled={i === 0}
            onClick={() => setI((n) => n - 1)}
          >
            {t("pl.prev")}
          </button>
          {i < paper.length - 1 ? (
            <button className="btn" onClick={() => setI((n) => n + 1)}>
              {t("pl.next")}
            </button>
          ) : (
            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? t("pl.submitting") : t("pl.submit")}
            </button>
          )}
          {answered < paper.length && (
            <span style={{ fontSize: 12.5, color: "var(--amber)" }}>
              {paper.length - answered} {t("pl.unanswered")}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
