"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STUDENT = [
  { href: "/dashboard", gl: "首", vi: "Bảng điều khiển" },
  { href: "/learn", gl: "階", vi: "Lộ trình học" },
  { href: "/homework", gl: "業", vi: "Bài tập" },
  { href: "/review", gl: "複", vi: "Ôn tập" },
];
const TEACHER = [
  { href: "/teacher", gl: "班", vi: "Lớp học" },
  { href: "/teacher/assign", gl: "派", vi: "Giao bài tập" },
];

export function Rail({ isTeacher }: { isTeacher: boolean }) {
  const path = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="rail">
      <Link href="/dashboard" className="brand">
        <div className="seal">娟</div>
        <div>
          <b>QNA Chinese</b>
          <small>Tiếng Trung Quyên Huỳnh</small>
        </div>
      </Link>

      <div>
        <div className="navlbl">Học viên</div>
        {STUDENT.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="nav"
            data-active={path === n.href || path.startsWith(n.href + "/")}
          >
            <span className="gl">{n.gl}</span>
            {n.vi}
          </Link>
        ))}
      </div>

      {isTeacher && (
        <div>
          <div className="navlbl">Giáo viên</div>
          {TEACHER.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="nav"
              data-active={
                n.href === "/teacher" ? path === "/teacher" : path.startsWith(n.href)
              }
            >
              <span className="gl">{n.gl}</span>
              {n.vi}
            </Link>
          ))}
        </div>
      )}

      <div className="railfoot">
        <button className="nav" onClick={signOut} style={{ padding: "6px 8px" }}>
          <span className="gl">出</span>Đăng xuất
        </button>
      </div>
    </aside>
  );
}
