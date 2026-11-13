"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, X, Moon, Sun, RotateCcw, LogOut, Globe, ChevronDown } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { Dropdown, MenuItem, Modal, Input, Badge } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { STUDENT_NAV, PARENT_NAV, ADMIN_NAV, type NavItem } from "./nav-config";
import { UI_LANGUAGES, BOARDS, CLASSES } from "@/data/mock-curriculum";
import type { Role } from "@/types";
import { getSession, roleOf, signOut, type Session } from "@/lib/session";

const ROLE_HOME: Record<Role, string> = { student: "/student", parent: "/parent", admin: "/admin" };
const NAVS: Record<Role, NavItem[]> = { student: STUDENT_NAV, parent: PARENT_NAV, admin: ADMIN_NAV };
const ROLE_LABEL: Record<Role, string> = { student: "Student", parent: "Parent", admin: "Admin" };

function AccountMenu({ session }: { session: Session }) {
  const { resetDemo } = useDemo();
  const router = useRouter();
  return (
    <Dropdown trigger={
      <button className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-oxford hover:bg-oxford-50 dark:text-slate-100 dark:border-[#2A3F63]" aria-label="Account menu">
        <span className="hidden max-w-[10rem] truncate sm:inline">{session.user.name}</span>
        <span className="rounded-full bg-oxford px-1.5 py-0.5 text-[10px] text-white">{ROLE_LABEL[roleOf(session)]}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      {(close) => (
        <div className="w-64">
          <p className="truncate px-3 py-1.5 text-xs text-slate-500">{session.user.email}</p>
          <MenuItem onClick={async () => { close(); await signOut(); router.replace("/#login"); }}><LogOut className="h-4 w-4" />Sign out</MenuItem>
          <div className="my-1.5 border-t border-line" />
          <p className="px-3 py-1 text-xs text-slate-500">Pages still show demonstration data.</p>
          <MenuItem onClick={() => { close(); resetDemo(); }}><RotateCcw className="h-4 w-4" />Reset demo data</MenuItem>
        </div>
      )}
    </Dropdown>
  );
}

function NavList({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        const Icon = it.icon;
        const sub = it.group === "sub";
        if (sub && collapsed) return null;
        return (
          <Link key={it.href} href={it.href} onClick={onNavigate} title={collapsed ? it.label : undefined}
            className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              sub && "ml-5 py-1.5 text-[13px]",
              active ? "bg-oxford text-white shadow-sm" : "text-slate-600 hover:bg-oxford-50 hover:text-oxford dark:text-slate-300 dark:hover:bg-[#16284a]",
              collapsed && "justify-center px-0")}>
            <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-sun" : "text-slate-400 group-hover:text-oxford")} />
            {!collapsed && <span className="truncate">{it.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SearchModal({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItem[] }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const extra = [
    "Linear Equations", "Factorisation", "Force and Pressure", "Why does the moon change shape?", "Algebraic Identities",
  ];
  const results = useMemo(() => q.trim() ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : items.slice(0, 6), [q, items]);
  const topics = q.trim() ? extra.filter((e) => e.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <Modal open={open} onClose={onClose} title="Search">
      <Input autoFocus placeholder="Search lessons, tools and topics…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <div className="mt-3 space-y-1">
        {results.map((r) => (
          <button key={r.href} onClick={() => { router.push(r.href); onClose(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-oxford-50">
            <r.icon className="h-4 w-4 text-oxford" />{r.label}
          </button>
        ))}
        {topics.map((t) => (
          <button key={t} onClick={() => { router.push("/student/teacher"); onClose(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-oxford-50">
            <Search className="h-4 w-4 text-crimson" />Ask teacher: {t}
          </button>
        ))}
        {!results.length && !topics.length && <p className="py-6 text-center text-sm text-slate-500">No results for “{q}”. Try a subject or chapter name.</p>}
      </div>
    </Modal>
  );
}

export function PortalShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { role: current, setRole, profile, setProfile, theme, setTheme, notices, setNotices, toast } = useDemo();
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = NAVS[role];
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // Signed out → login; signed in with another role → that role's portal.
  useEffect(() => {
    const s = getSession();
    if (!s) router.replace(`/?role=${role}#login`);
    else if (roleOf(s) !== role) router.replace(ROLE_HOME[roleOf(s)]);
    else setSession(s);
  }, [role]); // eslint-disable-line

  // keep demo role in sync with route
  useEffect(() => { if (current !== role) setRole(role); }, [role]); // eslint-disable-line
  useEffect(() => { setMobile(false); }, [path]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const unread = notices.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = session?.user.name.split(" ")[0] ?? "";
  const avatar = role === "student" ? profile.avatar : role === "parent" ? "👩" : "🛠️";

  if (!session) return null;
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white transition-all dark:bg-[#0D1930] dark:border-[#1E3050] lg:flex", collapsed ? "w-[76px]" : "w-64")}>
        <div className={cn("flex h-16 items-center border-b border-line px-4 dark:border-[#1E3050]", collapsed && "justify-center px-0")}>
          <Link href="/" aria-label="CARAWIN AI TUTOR home"><Logo compact={collapsed} /></Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3 scroll-thin"><NavList items={items} collapsed={collapsed} /></div>
        <div className="border-t border-line p-3 dark:border-[#1E3050]">
          <button onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-oxford-50" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen className="mx-auto h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" />Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-oxford-900/50" onClick={() => setMobile(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-3 shadow-lift">
            <div className="mb-3 flex items-center justify-between px-1"><Logo /><button onClick={() => setMobile(false)} aria-label="Close menu" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="flex-1 overflow-y-auto"><NavList items={items} onNavigate={() => setMobile(false)} /></div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-6 dark:bg-[#0D1930]/90 dark:border-[#1E3050]">
          <button className="rounded-lg p-2 hover:bg-oxford-50 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-semibold text-oxford dark:text-white">{greet}, {first}!</p>
            <p className="truncate text-xs text-slate-500">{role === "student" ? "Ready to learn something new today?" : role === "parent" ? "Here is how your children are learning." : "Academic administration workspace"}</p>
          </div>
          <div className="flex-1" />
          <button onClick={() => setSearchOpen(true)} className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-line bg-mist px-3 text-sm text-slate-400 hover:border-oxford-300 sm:flex dark:bg-[#0F1C33] dark:border-[#2A3F63]">
            <Search className="h-4 w-4" /><span className="flex-1 text-left">Search…</span><kbd className="rounded border border-line bg-white px-1.5 text-[10px] dark:bg-transparent">⌘K</kbd>
          </button>
          <button onClick={() => setSearchOpen(true)} className="rounded-lg p-2 hover:bg-oxford-50 sm:hidden" aria-label="Search"><Search className="h-5 w-5" /></button>

          {role === "student" && (
            <>
              <Dropdown trigger={<button className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm hover:bg-oxford-50 md:flex dark:border-[#2A3F63]" aria-label="Board and class">{profile.board} · Class {profile.classLevel}<ChevronDown className="h-3.5 w-3.5" /></button>}>
                {(close) => (
                  <div className="max-h-80 w-56 overflow-y-auto scroll-thin">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Board</p>
                    {BOARDS.map((b) => <MenuItem key={b.id} active={profile.board === b.id} onClick={() => { setProfile({ board: b.id }); toast(`Board changed to ${b.label}`); }}>{b.label}</MenuItem>)}
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Class</p>
                    {CLASSES.map((c) => <MenuItem key={c} active={profile.classLevel === c} onClick={() => { setProfile({ classLevel: c }); toast(`Class ${c} selected`); close(); }}>Class {c}</MenuItem>)}
                  </div>
                )}
              </Dropdown>
              <Dropdown trigger={<button className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm hover:bg-oxford-50 md:flex dark:border-[#2A3F63]" aria-label="Language"><Globe className="h-4 w-4" />{profile.language}</button>}>
                {(close) => (
                  <div className="max-h-80 w-52 overflow-y-auto scroll-thin">
                    {UI_LANGUAGES.map((l) => <MenuItem key={l} active={profile.language === l} onClick={() => { setProfile({ language: l }); toast(l === "English" ? "Language: English" : `${l} selected — in this prototype, responses stay in English`, "info"); close(); }}>{l}</MenuItem>)}
                  </div>
                )}
              </Dropdown>
            </>
          )}

          <button className="rounded-lg p-2 hover:bg-oxford-50" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>

          <Dropdown trigger={
            <button className="relative rounded-lg p-2 hover:bg-oxford-50" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white">{unread}</span>}
            </button>}>
            {() => (
              <div className="w-80 max-w-[85vw]">
                <div className="flex items-center justify-between px-3 py-1.5"><p className="text-sm font-semibold">Notifications</p>
                  <button className="text-xs text-crimson" onClick={() => setNotices((n) => n.map((x) => ({ ...x, read: true })))}>Mark all read</button></div>
                {notices.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">You're all caught up.</p>}
                {notices.map((n) => (
                  <button key={n.id} onClick={() => setNotices((l) => l.map((x) => x.id === n.id ? { ...x, read: true } : x))} className={cn("flex w-full gap-2 rounded-lg px-3 py-2 text-left hover:bg-oxford-50", !n.read && "bg-oxford-50/60")}>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-slate-300" : "bg-crimson")} />
                    <span><span className="block text-sm font-medium">{n.title}</span><span className="block text-xs text-slate-500">{n.body}</span><span className="text-[11px] text-slate-400">{n.time}</span></span>
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
          <AccountMenu session={session} />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-oxford-50 text-lg" aria-label="Profile avatar">{avatar}</div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} items={items} />
    </div>
  );
}
