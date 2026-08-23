"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";
import { createClient } from "@/lib/supabase/client";

export interface TeacherClass {
  id: number;
  name: string;
  code: string;
  lock_to_assigned: boolean;
}

export interface RosterRow {
  class_id: number;
  class_code: string;
  lock_to_assigned: boolean;
  student_id: string;
  display_name: string | null;
  current_level: number;
  tocfl_level: string | null;
  level_source: string | null;
  placed_at: string | null;
  streak_days: number;
  last_active: string | null;
  lessons_done: number;
  cards_due: number;
}

const TOCFL = [
  "",
  "準備級 1",
  "準備級 2",
  "入門級 3",
  "基礎級 4",
  "進階級 5",
  "高階級 6",
  "文言 W1",
  "文言 W2",
  "文言 W3",
];

function daysSince(d: string | null) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export function TeacherView({
  classes,
  roster,
}: {
  classes: TeacherClass[];
  roster: RosterRow[];
}) {
  const { t } = usePrefs();
  const router = useRouter();

  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [locks, setLocks] = useState<Record<number, boolean>>(
    Object.fromEntries(classes.map((c) => [c.id, c.lock_to_assigned]))
  );

  const atRisk = roster.filter((r) => daysSince(r.last_active) >= 7);
  const active = roster.length - atRisk.length;

  async function setLevel(studentId: string, lvl: number) {
    setBusy(studentId);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("teacher_set_level", {
      student: studentId,
      new_level: lvl,
      new_tocfl: TOCFL[lvl] || null,
    });
    setBusy(null);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  async function toggleLock(classId: number, next: boolean) {
    setLocks((s) => ({ ...s, [classId]: next }));
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("classes")
      .update({ lock_to_assigned: next })
      .eq("id", classId);
    if (error) {
      setLocks((s) => ({ ...s, [classId]: !next }));
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  const first = classes[0];

  return (
    <>
      <Toolbar crumb={t("nav.class")} />
      <div className="wrap">
        <div className="eyebrow">{t("nav.section.teacher")}</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {first?.name ?? "—"}{" "}
          {first && (
            <span className="chip zhu" style={{ marginLeft: 8 }}>
              {first.code}
            </span>
          )}
        </h1>
        <p className="lede">
          Ba câu hỏi cần trả lời: ai đang tụt lại, ai sắp bỏ, tuần này nên giảng
          lại gì. Mọi con số khác đều là nhiễu.
          <br />
          三個問題：誰落後、誰快流失、這週該重講什麼。其餘數字都是雜訊。
        </p>

        {err && <p className="err">{err}</p>}

        <div className="kpis" style={{ margin: "22px 0 10px" }}>
          <div className="kpi">
            <div className="l">{t("tc.ok")}</div>
            <div className="v">
              {active}
              <span style={{ fontSize: 15, color: "var(--text-3)" }}>
                /{roster.length}
              </span>
            </div>
            <div className="d">7 ngày qua · 近七天有學習</div>
          </div>
          <div className="kpi">
            <div className="l">{t("tc.risk")}</div>
            <div className="v" style={{ color: "var(--zhu)" }}>
              {atRisk.length}
            </div>
            <div className="d">≥ 7 ngày · 七天未登入</div>
          </div>
          <div className="kpi">
            <div className="l">{t("nav.review")}</div>
            <div className="v">
              {roster.reduce((s, r) => s + (r.cards_due ?? 0), 0)}
            </div>
            <div className="d">thẻ đến hạn cả lớp · 全班待複習</div>
          </div>
          <div className="kpi">
            <div className="l">{t("nav.class")}</div>
            <div className="v" style={{ fontSize: 20, fontFamily: "var(--mono)" }}>
              {first?.code ?? "—"}
            </div>
            <div className="d">mã vào lớp · 入班代碼</div>
          </div>
        </div>

        {/* ── chế độ chỉ học bài được giao / 指派模式開關 ── */}
        {classes.length > 0 && (
          <div className="card" style={{ maxWidth: 720, marginTop: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{t("tc.lockmode")}</h2>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-2)",
                margin: "8px 0 14px",
                lineHeight: 1.75,
              }}
            >
              {t("tc.lockmode.help")}
            </p>
            {classes.map((c) => (
              <label
                key={c.id}
                className="row"
                style={{
                  justifyContent: "space-between",
                  padding: "8px 0",
                  cursor: "pointer",
                }}
              >
                <span>
                  <b>{c.name}</b>{" "}
                  <span className="chip" style={{ marginLeft: 6 }}>
                    {c.code}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={locks[c.id] ?? false}
                  onChange={(e) => toggleLock(c.id, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--zhu)" }}
                />
              </label>
            ))}
          </div>
        )}

        <div className="tablewrap" style={{ marginTop: 22 }}>
          <table>
            <thead>
              <tr>
                <th>{t("tc.student")}</th>
                <th>{t("tc.level")}</th>
                <th>{t("tc.setlevel")}</th>
                <th>{t("nav.learn")}</th>
                <th>{t("dash.streak")}</th>
                <th>{t("nav.review")}</th>
                <th>{t("tc.lastactive")}</th>
                <th>{t("tc.status")}</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const gap = daysSince(r.last_active);
                const state =
                  gap >= 7
                    ? ["zhu", t("tc.risk")]
                    : gap >= 3
                      ? ["amber", t("tc.slow")]
                      : ["jade", t("tc.ok")];
                const srcKey =
                  r.level_source === "teacher"
                    ? "learn.source.teacher"
                    : r.level_source === "test"
                      ? "learn.source.test"
                      : "learn.source.default";
                return (
                  <tr key={`${r.class_id}-${r.student_id}`}>
                    <td>
                      <b>{r.display_name ?? "—"}</b>
                    </td>
                    <td>
                      {r.tocfl_level ?? r.current_level}
                      <br />
                      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                        {t(srcKey)}
                      </span>
                    </td>
                    <td>
                      <select
                        value={r.current_level}
                        disabled={busy === r.student_id}
                        onChange={(e) =>
                          setLevel(r.student_id, Number(e.target.value))
                        }
                        style={{
                          font: "inherit",
                          fontSize: 13,
                          padding: "4px 6px",
                          borderRadius: 8,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                          color: "var(--text)",
                        }}
                      >
                        {TOCFL.slice(1).map((label, n) => (
                          <option key={n + 1} value={n + 1}>
                            {n + 1} · {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num">{r.lessons_done}</td>
                    <td className="num">{r.streak_days}</td>
                    <td className="num">{r.cards_due}</td>
                    <td className="num">{r.last_active ?? "—"}</td>
                    <td>
                      <span className={`chip ${state[0]}`}>{state[1]}</span>
                    </td>
                  </tr>
                );
              })}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--text-3)" }}>
                    Chưa có học viên nào. Tạo một lớp trong bảng{" "}
                    <code>classes</code> rồi đưa mã lớp cho học viên khi đăng ký.
                    <br />
                    尚無學生：先在 classes 建一個班，把班級代碼給學生註冊時輸入。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="note">
          Đổi cấp bằng tay sẽ ghi <code>level_source = &apos;teacher&apos;</code>, và
          từ đó kết quả bài kiểm tra xếp lớp <b>không ghi đè</b> nữa.
          <br />
          手動改等級會把來源設為「老師」，之後分級測驗結果不會再覆蓋。
        </p>
      </div>
    </>
  );
}
