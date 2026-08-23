"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePrefs } from "@/components/PrefsProvider";

const STUDENT = [
  { href: "/dashboard", gl: "覽", key: "nav.dashboard" },
  { href: "/learn", gl: "階", key: "nav.learn" },
  { href: "/homework", gl: "業", key: "nav.homework" },
  { href: "/review", gl: "複", key: "nav.review" },
  { href: "/placement", gl: "測", key: "nav.placement" },
];
const TEACHER = [
  { href: "/teacher", gl: "班", key: "nav.class" },
  { href: "/teacher/assign", gl: "派", key: "nav.assign" },
];

export function Rail({ isTeacher }: { isTeacher: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const { t } = usePrefs();

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
        <div className="navlbl">{t("nav.section.student")}</div>
        {STUDENT.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="nav"
            data-active={path === n.href || path.startsWith(n.href + "/")}
          >
            <span className="gl">{n.gl}</span>
            {t(n.key)}
          </Link>
        ))}
      </div>

      {isTeacher && (
        <div>
          <div className="navlbl">{t("nav.section.teacher")}</div>
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
              {t(n.key)}
            </Link>
          ))}
        </div>
      )}

      <div className="railfoot">
        <button className="nav" onClick={signOut} style={{ padding: "6px 8px" }}>
          <span className="gl">出</span>
          {t("nav.signout")}
        </button>
      </div>
    </aside>
  );
}
