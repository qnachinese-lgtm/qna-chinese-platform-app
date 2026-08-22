import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const PAIRS: [string, string, string, boolean][] = [
  ["大學", "đại học", "Bạn đã biết rồi", true],
  ["國際", "quốc tế", "Bạn đã biết rồi", true],
  ["方便", "phương tiện", "Bạn giả — cẩn thận", false],
];

export default async function Landing() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="wrap" style={{ margin: "0 auto" }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", paddingTop: 8 }}
      >
        <div className="brand" style={{ padding: 0 }}>
          <div className="seal">娟</div>
          <div>
            <b>QNA Chinese</b>
            <small>Tiếng Trung Quyên Huỳnh</small>
          </div>
        </div>
        <div className="row">
          <Link href="/login" className="btn ghost">
            Đăng nhập
          </Link>
          <Link href="/signup" className="btn">
            Tạo tài khoản
          </Link>
        </div>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">Dành riêng cho người Việt học tiếng Trung</div>
          <h1 style={{ marginTop: 14 }}>
            Bạn đã biết <em>3.000 từ</em> tiếng Trung mà chưa hề học
          </h1>
          <p className="lede" style={{ marginTop: 16, fontSize: 16 }}>
            Học sinh 學生 · đại học 大學 · quốc tế 國際. Khoảng 60–70% từ vựng
            tiếng Việt là từ Hán-Việt — đó là lợi thế bẩm sinh của người Việt khi
            học tiếng Trung, nhưng chưa nền tảng nào biến nó thành phương pháp
            dạy. QNA Chinese đưa âm Hán-Việt lên thành một tuyến chú âm ngang
            hàng với pinyin và chú âm phù hiệu.
          </p>
          <div className="row" style={{ marginTop: 22 }}>
            <Link href="/signup" className="btn">
              Bắt đầu miễn phí →
            </Link>
            <Link href="/login" className="btn ghost">
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>

        <div className="bridge">
          <span className="lbl">Cầu nối Hán-Việt · 漢越橋</span>
          {PAIRS.map(([zh, vi, hint, good]) => (
            <div className="bpair" key={zh}>
              <span className="zhw">{zh}</span>
              <span style={{ color: "var(--lotus)" }}>{good ? "→" : "≠"}</span>
              <span
                className="viw"
                style={good ? undefined : { color: "var(--zhu)" }}
              >
                {vi}
                <small>{hint}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid3" style={{ marginTop: 30 }}>
        <div className="card">
          <div className="eyebrow">01 / Hán-Việt</div>
          <h3 style={{ margin: "8px 0 6px", fontSize: 17 }}>
            Ba nhóm từ Hán-Việt
          </h3>
          <p style={{ fontSize: 13.5, color: "var(--text-2)" }}>
            Đồng hình đồng nghĩa · cùng gốc khác cách dùng · bạn giả. Phân loại
            nằm ngay trong cột dữ liệu của từ, nên bài tập, lịch ôn và gợi ý đọc
            đều dùng được.
          </p>
        </div>
        <div className="card">
          <div className="eyebrow">02 / Phồn–giản</div>
          <h3 style={{ margin: "8px 0 6px", fontSize: 17 }}>
            Hai bộ chữ song song
          </h3>
          <p style={{ fontSize: 13.5, color: "var(--text-2)" }}>
            Không chuyển đổi chuỗi lúc chạy — phồn thể và giản thể là hai cột
            riêng, khóa thủ công ở những chữ một-nhiều. Đổi tức thì, không bao
            giờ sai.
          </p>
        </div>
        <div className="card">
          <div className="eyebrow">03 / Hai kỳ thi</div>
          <h3 style={{ margin: "8px 0 6px", fontSize: 17 }}>
            HSK và TOCFL cùng lúc
          </h3>
          <p style={{ fontSize: 13.5, color: "var(--text-2)" }}>
            Người Việt trong nước thi HSK, người Việt ở Đài Loan thi TOCFL. Một
            kho từ vựng gắn hai bộ nhãn cấp độ, phục vụ cả hai thị trường.
          </p>
        </div>
      </div>

      <p className="note" style={{ marginTop: 30 }}>
        Tiến độ học được lưu trên máy chủ: đổi điện thoại, đổi máy tính hay quay
        lại sau ba tháng, hàng đợi ôn tập và lịch sử học vẫn còn nguyên.
      </p>
    </main>
  );
}
