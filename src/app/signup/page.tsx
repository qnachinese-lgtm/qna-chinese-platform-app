"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, native_lang: "vi" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    // Nếu dự án bật xác nhận email thì chưa có session ngay.
    // 若專案開啟 email 驗證，此時還沒有 session。
    if (!data.session) {
      setInfo(
        "Đã gửi email xác nhận. Mở hộp thư và bấm vào liên kết để kích hoạt tài khoản."
      );
      setBusy(false);
      return;
    }

    if (classCode.trim()) {
      const { error: joinErr } = await supabase.rpc("join_class", {
        class_code: classCode.trim(),
      });
      if (joinErr) setError(`Tài khoản đã tạo, nhưng: ${joinErr.message}`);
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="wrap"
      style={{ maxWidth: 400, margin: "0 auto", paddingTop: 70 }}
    >
      <div className="brand" style={{ padding: 0, marginBottom: 26 }}>
        <div className="seal">娟</div>
        <div>
          <b>QNA Chinese</b>
          <small>Tiếng Trung Quyên Huỳnh</small>
        </div>
      </div>

      <div className="card">
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
          Tạo tài khoản
        </h1>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18 }}>
          建立帳號 · miễn phí
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="nm">Tên hiển thị</label>
            <input
              id="nm"
              className="inp"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="em">Email</label>
            <input
              id="em"
              className="inp"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              id="pw"
              className="inp"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cc">Mã lớp học (nếu có) · 班級代碼</label>
            <input
              id="cc"
              className="inp"
              placeholder="QNA-2026A"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          </div>

          {error && <p className="err">{error}</p>}
          {info && <p className="ok">{info}</p>}

          <button className="btn wide" type="submit" disabled={busy}>
            {busy ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 12.5,
            color: "var(--text-3)",
          }}
        >
          Đã có tài khoản?{" "}
          <Link href="/login" style={{ color: "var(--zhu)", fontWeight: 600 }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
