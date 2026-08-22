import { createClient } from "@/lib/supabase/server";
import { Toolbar } from "@/components/Toolbar";

export const dynamic = "force-dynamic";

interface RosterRow {
  class_id: number;
  class_code: string;
  student_id: string;
  display_name: string | null;
  current_level: number;
  streak_days: number;
  last_active: string | null;
  lessons_done: number;
  cards_due: number;
}

function daysSince(d: string | null) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default async function TeacherPage() {
  const supabase = createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, code");

  const { data: roster } = await supabase
    .from("class_roster")
    .select("*")
    .order("display_name");

  const rows = (roster ?? []) as RosterRow[];
  const atRisk = rows.filter((r) => daysSince(r.last_active) >= 7);
  const active = rows.length - atRisk.length;

  return (
    <>
      <Toolbar crumb="Lớp học" />
      <div className="wrap">
        <div className="eyebrow">Giáo viên · 班級管理</div>
        <h1 className="h1" style={{ margin: "10px 0 12px" }}>
          {classes?.[0]?.name ?? "Chưa có lớp"}{" "}
          {classes?.[0] && (
            <span className="chip zhu" style={{ marginLeft: 8 }}>
              {classes[0].code}
            </span>
          )}
        </h1>
        <p className="lede">
          Ba câu hỏi cần trả lời: ai đang tụt lại, ai sắp bỏ, tuần này nên giảng
          lại gì. Mọi con số khác đều là nhiễu.
        </p>

        <div className="kpis" style={{ margin: "22px 0 10px" }}>
          <div className="kpi">
            <div className="l">Đang hoạt động</div>
            <div className="v">
              {active}
              <span style={{ fontSize: 15, color: "var(--text-3)" }}>
                /{rows.length}
              </span>
            </div>
            <div className="d">có học trong 7 ngày qua</div>
          </div>
          <div className="kpi">
            <div className="l">Có nguy cơ bỏ</div>
            <div className="v" style={{ color: "var(--zhu)" }}>
              {atRisk.length}
            </div>
            <div className="d">≥ 7 ngày không đăng nhập</div>
          </div>
          <div className="kpi">
            <div className="l">Thẻ đến hạn (cả lớp)</div>
            <div className="v">
              {rows.reduce((s, r) => s + (r.cards_due ?? 0), 0)}
            </div>
            <div className="d">tổng số thẻ chưa ôn</div>
          </div>
          <div className="kpi">
            <div className="l">Mã vào lớp</div>
            <div className="v" style={{ fontSize: 20, fontFamily: "var(--mono)" }}>
              {classes?.[0]?.code ?? "—"}
            </div>
            <div className="d">học viên nhập khi đăng ký</div>
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Bậc</th>
                <th>Bài đã xong</th>
                <th>Chuỗi ngày</th>
                <th>Thẻ đến hạn</th>
                <th>Hoạt động gần nhất</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const gap = daysSince(r.last_active);
                const state =
                  gap >= 7
                    ? ["zhu", "Nguy cơ"]
                    : gap >= 3
                      ? ["amber", "Chậm"]
                      : ["jade", "Tốt"];
                return (
                  <tr key={r.student_id}>
                    <td>
                      <b>{r.display_name ?? "—"}</b>
                    </td>
                    <td className="num">{r.current_level}</td>
                    <td className="num">{r.lessons_done}</td>
                    <td className="num">{r.streak_days}</td>
                    <td className="num">{r.cards_due}</td>
                    <td className="num">
                      {r.last_active ?? "chưa bao giờ"}
                    </td>
                    <td>
                      <span className={`chip ${state[0]}`}>{state[1]}</span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--text-3)" }}>
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
          Bảng này đọc từ view <code>class_roster</code>, và view chạy dưới quyền
          của chính người gọi (<code>security_invoker</code>) — nghĩa là RLS vẫn
          áp dụng: giáo viên chỉ thấy học viên trong lớp của mình, không cần thêm
          bất kỳ kiểm tra nào ở frontend.
          <br />
          老師只看得到自己班的學生，這條規則在資料庫層，不在前端。
        </p>
      </div>
    </>
  );
}
