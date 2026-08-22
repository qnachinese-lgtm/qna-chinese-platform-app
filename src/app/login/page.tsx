import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main
      className="wrap"
      style={{ maxWidth: 400, margin: "0 auto", paddingTop: 70 }}
    >
      <Link href="/" className="brand" style={{ padding: 0, marginBottom: 26 }}>
        <div className="seal">娟</div>
        <div>
          <b>QNA Chinese</b>
          <small>Tiếng Trung Quyên Huỳnh</small>
        </div>
      </Link>

      <div className="card">
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
          Đăng nhập
        </h1>
        <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18 }}>
          登入 QNA Chinese
        </p>

        <Suspense
          fallback={<p style={{ fontSize: 13, color: "var(--text-3)" }}>…</p>}
        >
          <LoginForm />
        </Suspense>

        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 12.5,
            color: "var(--text-3)",
          }}
        >
          Chưa có tài khoản?{" "}
          <Link href="/signup" style={{ color: "var(--zhu)", fontWeight: 600 }}>
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </main>
  );
}
