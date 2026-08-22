"use client";

import { useMemo, useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { RubyWord } from "@/components/RubyWord";
import { WordCard } from "@/components/WordCard";
import { usePrefs } from "@/components/PrefsProvider";
import { createClient } from "@/lib/supabase/client";
import { HV_LABEL, type Lesson, type LessonToken, type Lexeme } from "@/lib/types";

type Tab = "text" | "hanviet" | "quiz";

export function LessonView({
  lesson,
  tokens,
  knownIds,
}: {
  lesson: Lesson;
  tokens: LessonToken[];
  knownIds: number[];
}) {
  const { script, phonetic, showVi } = usePrefs();
  const [tab, setTab] = useState<Tab>("text");
  const [active, setActive] = useState<Lexeme | null>(null);
  const [known, setKnown] = useState<Set<number>>(new Set(knownIds));
  const [saved, setSaved] = useState(false);

  // Gom token theo dòng / 依行分組
  const lines = useMemo(() => {
    const map = new Map<number, LessonToken[]>();
    tokens.forEach((t) => {
      const arr = map.get(t.line_no) ?? [];
      arr.push(t);
      map.set(t.line_no, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [tokens]);

  // Từ Hán-Việt xuất hiện trong bài, gom theo ba nhóm
  const hanviet = useMemo(() => {
    const seen = new Map<number, Lexeme>();
    tokens.forEach((t) => {
      if (t.lexeme && t.lexeme.hv_class > 0) seen.set(t.lexeme.id, t.lexeme);
    });
    return Array.from(seen.values()).sort((a, b) => a.hv_class - b.hv_class);
  }, [tokens]);

  async function markKnown(id: number) {
    setKnown((s) => new Set(s).add(id));
    setActive(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("srs_cards").upsert(
      { user_id: user.id, lexeme_id: id, kind: "recognize", stability: 4 },
      { onConflict: "user_id,lexeme_id,kind" }
    );
  }

  async function completeLesson() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("progress").upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        percent: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
    setSaved(true);
  }

  return (
    <>
      <Toolbar crumb={`Bài ${lesson.level}-${lesson.id}`} />
      <div className="wrap">
        <div className="eyebrow">
          Bậc {lesson.level} · HSK {lesson.hsk_level ?? "—"} ·{" "}
          {lesson.tocfl_level ?? "—"}
        </div>
        <h1 className="h1" style={{ margin: "10px 0 4px" }}>
          {lesson.title_vi}
          <span
            style={{
              fontFamily: "var(--serif)",
              color: "var(--text-3)",
              fontWeight: 400,
              fontSize: 20,
              marginLeft: 12,
            }}
          >
            {script === "trad" ? lesson.title_trad : lesson.title_simp}
          </span>
        </h1>
        {lesson.summary_vi && (
          <p className="lede" style={{ marginTop: 8 }}>
            {lesson.summary_vi}
          </p>
        )}

        <div className="row" style={{ margin: "20px 0 18px", gap: 6 }}>
          {(
            [
              ["text", "1 · Hội thoại"],
              ["hanviet", `2 · Hán-Việt (${hanviet.length})`],
              ["quiz", "3 · Luyện tập"],
            ] as [Tab, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              className={tab === v ? "btn" : "btn ghost"}
              onClick={() => setTab(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "text" && (
          <>
            <div className="card">
              <div className={`dialog txt mode-${phonetic}`}>
                {lines.map(([lineNo, toks]) => {
                  const speaker = toks.find((t) => t.speaker)?.speaker ?? "";
                  const vi = toks.find((t) => t.line_vi)?.line_vi ?? "";
                  return (
                    <div className="turn" key={lineNo}>
                      <div className="who">{speaker}</div>
                      <div>
                        <div>
                          {toks.map((t) =>
                            t.lexeme ? (
                              <RubyWord
                                key={t.id}
                                lexeme={t.lexeme}
                                script={script}
                                phonetic={phonetic}
                                hot={active?.id === t.lexeme.id}
                                known={known.has(t.lexeme.id)}
                                onClick={setActive}
                              />
                            ) : (
                              <span className="punc" key={t.id}>
                                {t.punctuation}
                              </span>
                            )
                          )}
                        </div>
                        {showVi && vi && <div className="vitrans">{vi}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn" onClick={completeLesson} disabled={saved}>
                {saved ? "Đã lưu tiến độ ✓" : "Hoàn thành bài này"}
              </button>
            </div>
          </>
        )}

        {tab === "hanviet" && (
          <>
            <p className="lede" style={{ marginBottom: 16 }}>
              Ba nhóm từ Hán-Việt trong bài. Nhóm 1 bạn có thể mang thẳng từ
              tiếng Việt sang; nhóm 3 là bẫy, phải tách ra học riêng.
            </p>
            <div className="grid3">
              {hanviet.map((lx) => (
                <div
                  className="card"
                  key={lx.id}
                  style={{
                    borderLeft: `3px solid ${
                      lx.hv_class === 1
                        ? "var(--jade)"
                        : lx.hv_class === 2
                          ? "var(--amber)"
                          : "var(--zhu)"
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                  >
                    {script === "trad" ? lx.trad : lx.simp}
                  </div>
                  <div
                    style={{
                      color: "var(--lotus)",
                      fontStyle: "italic",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  >
                    {lx.hanviet.join(" ")}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-2)",
                      marginTop: 6,
                    }}
                  >
                    Nghĩa đúng: <b>{lx.hv_vi_word ?? lx.gloss_vi}</b>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9.5,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "var(--text-3)",
                      marginTop: 8,
                    }}
                  >
                    {HV_LABEL[lx.hv_class]}
                  </div>
                  {lx.hv_warning && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--zhu)",
                        background: "var(--zhu-wash)",
                        padding: "7px 9px",
                        borderRadius: 6,
                        marginTop: 8,
                        lineHeight: 1.6,
                      }}
                    >
                      {lx.hv_warning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "quiz" && <Quiz />}

        {active && (
          <WordCard
            lexeme={active}
            script={script}
            onClose={() => setActive(null)}
            onKnown={markKnown}
          />
        )}
      </div>
    </>
  );
}

/** Câu hỏi mẫu nhắm thẳng vào bẫy Hán-Việt / 專打漢越陷阱的練習題 */
function Quiz() {
  const [picked, setPicked] = useState<number | null>(null);
  const options = [
    { label: "Tiện lợi（便利）", ok: true },
    { label: "Phương tiện（工具、交通工具）", ok: false },
    { label: "Phương pháp（方法）", ok: false },
    { label: "Phương hướng（方向）", ok: false },
  ];

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="eyebrow">Câu 1 / 8 · Từ Hán-Việt</div>
      <p style={{ fontSize: 15, margin: "10px 0 16px" }}>
        Từ「方便」trong tiếng Trung có nghĩa là gì?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((o, i) => (
          <button
            key={i}
            className="btn ghost"
            style={{
              justifyContent: "flex-start",
              borderColor:
                picked === i
                  ? o.ok
                    ? "var(--jade)"
                    : "var(--zhu)"
                  : undefined,
              background:
                picked === i
                  ? o.ok
                    ? "var(--jade-wash)"
                    : "var(--zhu-wash)"
                  : undefined,
            }}
            onClick={() => setPicked(i)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "var(--text-2)",
            background: "var(--surface-2)",
            padding: "11px 14px",
            borderRadius: 8,
            lineHeight: 1.7,
          }}
        >
          {options[picked].ok
            ? "Chính xác. 方便 = tiện lợi. Tiếng Việt “phương tiện” tuy cùng gốc Hán nhưng đã tách nghĩa — đây là bạn giả (nhóm 3), phải học riêng."
            : "Chưa đúng. Đây chính là cái bẫy: tiếng Việt “phương tiện” nghĩa là công cụ / phương tiện giao thông, còn 方便 trong tiếng Trung nghĩa là tiện lợi."}
        </p>
      )}
    </div>
  );
}
