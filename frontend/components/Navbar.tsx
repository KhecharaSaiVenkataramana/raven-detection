"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/detection", label: "Detection" },
  { href: "/datasets", label: "Datasets" },
  { href: "/about", label: "About" },
  { href: "/history", label: "History" },
  { href: "/discuss", label: "Discuss" },
];

export default function Navbar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [light, setLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("light");
  });

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("raven-theme", next ? "light" : "dark");
    } catch {}
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="navbar" id="main-navbar">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Image src="/ui/logo.png" alt="RAVEN logo" width={60} height={60} className="logo-img" />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span className="brand-name">RAVEN</span>
          <span className="brand-tagline">DETECTION THAT NEVER BLINKS</span>
        </div>
      </Link>

      <div className="nav-links">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={active ? "active" : ""}>
              {link.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
        {userEmail ? (
          <>
            <Link href="/profile" style={{ color: "var(--cyan)", fontSize: 14, fontWeight: 500 }}>
              👤 {userEmail}
            </Link>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                border: "1px solid rgba(102,68,255,0.33)",
                color: "var(--text-dim)",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: "var(--text-dim)", fontSize: 14 }}>
              Login
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>
              Register
            </Link>
          </>
        )}

        <label
          title="Toggle light/dark mode"
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <span style={{ fontSize: 13 }}>🌙</span>
          <span style={{ position: "relative", display: "inline-block" }}>
            <input
              type="checkbox"
              checked={light}
              onChange={toggleTheme}
              suppressHydrationWarning
              style={{ opacity: 0, position: "absolute", width: 44, height: 22, margin: 0, cursor: "pointer" }}
            />
            <span className="toggle-track" />
            <span className="toggle-knob" suppressHydrationWarning style={{ left: light ? 24 : 2 }} />
          </span>
          <span style={{ fontSize: 13 }}>☀️</span>
        </label>
      </div>
    </div>
  );
}
