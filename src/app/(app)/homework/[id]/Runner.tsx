"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { ExerciseItem, type Response } from "@/components/exercises/ExerciseItem";
import { createClient } from "@/lib/supabase/client";
import { KIND_LABEL, type ExerciseKind } from "@/lib/exercises";
import type { AssignmentItem, ReviewRow } from "@/lib/types";

interface Props {
  assignment: { id: number; title: string; instructions_vi: string | null; due_at: string | null };
  submissionId: number;
  alreadySubmitted: boolean;
  items: AssignmentItem[];
  initial: Record<number, Response>;
}

export function Runner({
  assignment,
  submissionId,
  alreadySubmitted,
  items,
  initial,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, Response>>(initial);
  const [i, setI] = useState(0);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [review, setReview] = useState<ReviewRow[] | null>(null);
  const [result, setResult] = useState<{
    score: number; max_score: number; pending: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("submission_review", {
      s_id: submissionId,
    });
    if (error) setErr(error.message);
    else setReview((data ?? []) as ReviewRow[]);
  }, [submissionId]);

  useEffect(() => {
    if (submitted && !review) void loadReview();
  }, [submitted, review, loadReview]);

  /** Lưu từng câu ngay khi trả lời — đóng trình duyệt giữa chừng cũng không mất.
   *  每答一題就存，中途關掉瀏覽器也不會不見。 */
  async function saveAnswer(itemId: number, response: Response) {
    setAnswers((a) => ({ ...a, [itemId]: response }));
    const supabase = createClient();
    await supabase.from("submission_answers").upsert(
      { submission_id: submissionId, item_id: itemId, response },
      { onConflict: "submission_id,item_id" }
    );
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("grade_submission", {
      s_id: submissionId,
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setResult(row as any);
    setSubmitted(true);
    setBusy(false);
    setI(0);
  }

  const answeredCount = items.filter(
    (it) => answers[it.id] && Object.keys(answers[it.id]).length > 0
  ).length;

  const item = items[i];
  const reviewRow = review?.find((r) => r.item_id === item?.id) ?? null;

  if (items.length === 0) {
    return (
      <>
        <Toolbar crumb="Bài tập" />
        <div className="wrap">
          <p className="note">Bài tập này chưa có câu hỏi nào.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Toolbar crumb="Bài tập" />
      <div className="wrap">
        <div className="qhead">
          <div>
            <div className="eyebrow">
              {submitted ? "Xem lại · 檢討" : "Đang làm · 作答中"}
            </div>
            <h1 className="h1" style={{ marginTop: 8 }}>
              {assignment.title}
            </h1>
          </div>
          <span className="chip">
            {answeredCount}/{items.length} câu
          </span>
        </div>

        {result && (
          <div className="card" style={{ margin: "18px 0", maxWidth: 620 }}>
            <div className="row" style={{ alignItems: "baseline", gap: 16 }}>
              <span className="scorebig">
                {result.score}
                <span style={{ fontSize: 22, color: "var(--text-3)" }}>
                  /{result.max_score}
                </span>
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Đã nộp bài</p>
                <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  {result.pending > 0
                    ? `${result.pending} câu viết tay đang chờ giáo viên chấm.`
                    : "Tất cả các câu đã được chấm tự động."}
                </p>
              </div>
            </div>
            <p className="note" style={{ marginBottom: 0 }}>
              Những từ bạn trả lời sai đã được đưa vào{" "}
              <Link href="/review" style={{ color: "var(--zhu)", fontWeight: 600 }}>
                hàng đợi ôn tập
              </Link>{" "}
              cho hôm nay.
            </p>
          </div>
        )}

        <div className="qbar">
          {items.map((it, n) => {
            const r = review?.find((x) => x.item_id === it.id);
            return (
              <button
                key={it.id}
                className="qdot"
                aria-label={`Câu ${n + 1}`}
                data-current={n === i || undefined}
                data-done={
                  !submitted && answers[it.id] && Object.keys(answers[it.id]).length
                    ? true
                    : undefined
                }
                data-right={r?.is_correct === true || undefined}
                data-wrong={r?.is_correct === false || undefined}
                onClick={() => setI(n)}
              />
            );
          })}
        </div>

        <div className="card" style={{ maxWidth: 680 }}>
          <div className="qkind">
            Câu {i + 1} · {KIND_LABEL[item.kind as ExerciseKind] ?? item.kind} ·{" "}
            {item.points} điểm
          </div>
          <p className="qprompt">{item.prompt_vi}</p>

          <ExerciseItem
            item={item}
            value={answers[item.id] ?? {}}
            onChange={(r) => !submitted && saveAnswer(item.id, r)}
            locked={submitted}
            correct={reviewRow?.answer ?? null}
            isCorrect={reviewRow?.is_correct ?? null}
          />

          {submitted && reviewRow && (
            <div className="explain">
              {reviewRow.needs_review ? (
                <b>Câu này giáo viên sẽ chấm tay.</b>
              ) : (
                <b>
                  {reviewRow.is_correct ? "Chính xác." : "Chưa đúng."}{" "}
                </b>
              )}
              {reviewRow.explain_vi}
              {reviewRow.explain_zh && (
                <span className="zh">{reviewRow.explain_zh}</span>
              )}
            </div>
          )}
        </div>

        {err && <p className="err">{err}</p>}

        <div className="row" style={{ marginTop: 18 }}>
          <button
            className="btn ghost"
            disabled={i === 0}
            onClick={() => setI((n) => n - 1)}
          >
            ← Câu trước
          </button>
          {i < items.length - 1 ? (
            <button className="btn" onClick={() => setI((n) => n + 1)}>
              Câu sau →
            </button>
          ) : submitted ? (
            <Link href="/homework" className="btn">
              Về danh sách bài tập
            </Link>
          ) : (
            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? "Đang nộp…" : "Nộp bài"}
            </button>
          )}
          {!submitted && i === items.length - 1 && answeredCount < items.length && (
            <span style={{ fontSize: 12.5, color: "var(--amber)" }}>
              Còn {items.length - answeredCount} câu chưa trả lời.
            </span>
          )}
        </div>
      </div>
    </>
  );
}
