"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  RefreshCcw,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";

type User = { email: string; role: string; forcePasswordChange: boolean };
type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const common: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/security", label: "Account", icon: CircleUserRound },
];
const roleItems: Record<string, NavItem[]> = {
  employer: [
    {
      href: "/dashboard/requests",
      label: "Request staff",
      icon: ClipboardList,
    },
    { href: "/dashboard/client", label: "Placement support", icon: RefreshCcw },
    { href: "/dashboard/my-contracts", label: "Contracts", icon: FileCheck2 },
  ],
  candidate: [
    {
      href: "/dashboard/preferences",
      label: "My profile",
      icon: CircleUserRound,
    },
    {
      href: "/dashboard/applications",
      label: "Applications",
      icon: BriefcaseBusiness,
    },
    { href: "/dashboard/my-contracts", label: "Contracts", icon: FileCheck2 },
  ],
  agency_staff: [
    {
      href: "/dashboard/assisted-registration",
      label: "Register client",
      icon: UserCog,
    },
    { href: "/dashboard/matching", label: "Matching", icon: BriefcaseBusiness },
    { href: "/dashboard/jobs", label: "Job requests", icon: ClipboardList },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileCheck2 },
    { href: "/dashboard/finance", label: "Payments", icon: CreditCard },
    { href: "/dashboard/articles", label: "Articles", icon: Newspaper },
  ],
  administrator: [
    {
      href: "/dashboard/matching",
      label: "Candidates & matching",
      icon: BriefcaseBusiness,
    },
    { href: "/dashboard/jobs", label: "Job requests", icon: ClipboardList },
    { href: "/dashboard/contracts", label: "Contracts", icon: FileCheck2 },
    { href: "/dashboard/finance", label: "Payments", icon: CreditCard },
    { href: "/dashboard/articles", label: "Articles", icon: Newspaper },
    { href: "/dashboard/admin/users", label: "Users & staff", icon: UserCog },
    { href: "/dashboard/admin", label: "System control", icon: Settings },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (pathname === "/dashboard") return;
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) return router.replace("/login");
        if (!response.ok) throw new Error();
        setUser((await response.json()).user);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname, router]);
  if (pathname === "/dashboard") return children;
  if (!user)
    return (
      <main className="dashboard-loading">
        <span className="loader" />
        <p>Opening your secure workspace…</p>
      </main>
    );
  const items = [
    common[0],
    ...(roleItems[user.role] || []),
    ...common.slice(1),
  ];
  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
  }
  return (
    <div className="dashboard dashboard-subpage">
      <aside className="dash-sidebar">
        <Link href="/dashboard" className="dash-brand">
          DOUBLE M <small>AGENCY</small>
        </Link>
        <nav>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={`${href}-${label}`}
              className={pathname === href ? "active" : undefined}
            >
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <details className="dash-quicklinks">
          <summary>
            <Menu /> Menu
          </summary>
          <div>
            {items.map((item) => (
              <Link href={item.href} key={`quick-${item.href}-${item.label}`}>
                {item.label}
              </Link>
            ))}
            <button onClick={logout}>
              <LogOut /> Sign out
            </button>
          </div>
        </details>
        <button onClick={logout}>
          <LogOut /> Sign out
        </button>
      </aside>
      <section className="dash-main">
        <header className="dash-top workspace-account-bar">
          <Link href="/dashboard" aria-label="Return to dashboard">
            <ShieldCheck /> Secure workspace
          </Link>
          <div>
            <Link href="/dashboard/security" className="account-link">
              <CircleUserRound /> <span>{user.email}</span>
            </Link>
            <button onClick={logout} aria-label="Sign out">
              <LogOut />
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
