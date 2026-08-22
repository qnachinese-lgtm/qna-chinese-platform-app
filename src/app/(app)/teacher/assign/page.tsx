import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";
import { AssignForm } from "./AssignForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssignPage() {
  const supabase = createClient();

  const [{ data: classes }, { data: lessons }, { data: assignments }] =
    await Promise.all([
      supabase.from("classes").select("id, name, code"),
      supabase
        .from("lessons")
        .select("id, title_vi, title_trad, level")
        .eq("status", "published")
        .order("sort_order"),
      supabase
        .from("assignments")
        .select("id, title, due_at, created_at, class_id")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <>
      <Toolbar crumb="Giao bài tập" />
      <div className="wrap">
        <div className="eyebrow">Giao bài · 指派作業</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          Chọn bài học, đặt hạn nộp, xong.
        </h1>
        <p className="lede">
          Hệ thống tự sinh đề từ chính từ vựng và câu trong bài học đó — kể cả
          câu bẫy từ Hán-Việt. Sinh xong bạn vẫn sửa và xóa được từng câu.
        </p>

        <div style={{ display: "grid", gap: 20, marginTop: 24, maxWidth: 620 }}>
          <AssignForm
            classes={(classes ?? []) as any}
            lessons={(lessons ?? []) as any}
          />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "38px 0 12px" }}>
          Bài tập đã giao
        </h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Bài tập</th>
                <th>Hạn nộp</th>
                <th>Ngày giao</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(assignments ?? []).map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.title}</b>
                  </td>
                  <td className="num">
                    {a.due_at
                      ? new Date(a.due_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td className="num">
                    {new Date(a.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <Link
                      href={`/teacher/assignments/${a.id}`}
                      style={{ color: "var(--zhu)", fontWeight: 600 }}
                    >
                      Xem tiến độ →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!assignments || assignments.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-3)" }}>
                    Chưa giao bài tập nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
