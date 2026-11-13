"use client";
import React, { useState } from "react";
import { User, GraduationCap, Globe, Palette, Bell, Accessibility, Moon, Shield, LifeBuoy, RotateCcw } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, Select, Switch, Accordion, PageHeader, Tabs } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { BOARDS, CLASSES, SESSIONS, MEDIUMS, ALL_SUBJECTS, UI_LANGUAGES, TEACHING_STYLES } from "@/data/mock-curriculum";
import { AVATARS } from "@/data/mock-students";
import { cn } from "@/lib/utils";

export default function StudentSettings() {
  const { profile, setProfile, theme, setTheme, toast, resetDemo } = useDemo();
  const [tab, setTab] = useState("profile");
  const [draft, setDraft] = useState(profile);
  const [prefs, setPrefs] = usePersisted<Record<string, boolean>>("student-prefs", { reminders: true, weekly: true, streak: true, parent: true, largeText: false, reduceMotion: false, highContrast: false, share: false });
  const [err, setErr] = useState("");
  const setPref = (k: string) => (v: boolean) => { setPrefs((p) => ({ ...p, [k]: v })); if (k === "largeText") document.documentElement.style.fontSize = v ? "112.5%" : ""; toast("Saved", "info"); };
  const save = () => { if (draft.name.trim().length < 2) return setErr("Name must be at least 2 characters."); setErr(""); setProfile(draft); toast("Profile saved on this device"); };
  const toggleSub = (s: string) => setDraft((d) => ({ ...d, subjects: d.subjects.includes(s) ? d.subjects.filter((x) => x !== s) : [...d.subjects, s] }));
  const Row = ({ k, l, d }: { k: string; l: string; d?: string }) => <div className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium text-oxford dark:text-white">{l}</p>{d && <p className="text-xs text-slate-500">{d}</p>}</div><Switch checked={!!prefs[k]} onChange={setPref(k)} label={l} /></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Profile, learning preferences and accessibility." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: "profile", label: "Profile" }, { id: "learning", label: "Language & teaching" }, { id: "notify", label: "Notifications" }, { id: "access", label: "Accessibility & theme" }, { id: "privacy", label: "Privacy & help" }]} />
      {tab === "profile" && <div className="space-y-5">
        <Card><CardHeader title={<span className="flex items-center gap-2"><User className="h-4 w-4" />Personal profile</span>} />
          <div className="space-y-4 p-5"><div><p className="mb-2 text-sm font-medium">Avatar</p><div className="flex flex-wrap gap-2">{AVATARS.map((a) => <button key={a} aria-pressed={draft.avatar === a} aria-label={`Avatar ${a}`} onClick={() => setDraft({ ...draft, avatar: a })} className={cn("h-12 w-12 rounded-xl border-2 text-2xl", draft.avatar === a ? "border-oxford bg-oxford-50" : "border-line")}>{a}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Name" error={err}><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="Age"><Input value={draft.age} inputMode="numeric" onChange={(e) => setDraft({ ...draft, age: e.target.value })} /></Field></div></div></Card>
        <Card><CardHeader title={<span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Academic profile</span>} />
          <div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Board"><Select value={draft.board} onChange={(e) => setDraft({ ...draft, board: e.target.value })}>{BOARDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</Select></Field><Field label="Class"><Select value={draft.classLevel} onChange={(e) => setDraft({ ...draft, classLevel: e.target.value })}>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</Select></Field><Field label="Academic session"><Select value={draft.session} onChange={(e) => setDraft({ ...draft, session: e.target.value })}>{SESSIONS.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="Medium"><Select value={draft.medium} onChange={(e) => setDraft({ ...draft, medium: e.target.value })}>{MEDIUMS.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="School" className="sm:col-span-2"><Input value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} /></Field>
            <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Subjects</p><div className="flex flex-wrap gap-2">{ALL_SUBJECTS.map((s) => <button key={s} aria-pressed={draft.subjects.includes(s)} onClick={() => toggleSub(s)} className={cn("rounded-full border px-3 py-1 text-sm", draft.subjects.includes(s) ? "border-oxford bg-oxford text-white" : "border-line")}>{s}</button>)}</div></div></div></Card>
        <Button onClick={save}>Save profile</Button></div>}
      {tab === "learning" && <div className="space-y-5"><Card><CardHeader title={<span className="flex items-center gap-2"><Globe className="h-4 w-4" />Language</span>} subtitle="Only English and sample Hindi content are demonstrated" /><div className="p-5"><Select value={profile.language} onChange={(e) => { setProfile({ language: e.target.value }); toast(`Language: ${e.target.value}`, "info"); }}>{UI_LANGUAGES.map((l) => <option key={l}>{l}</option>)}</Select></div></Card>
        <Card><CardHeader title={<span className="flex items-center gap-2"><Palette className="h-4 w-4" />Default teaching style</span>} /><div className="space-y-2 p-5">{TEACHING_STYLES.map((s) => <button key={s.id} onClick={() => { setProfile({ teachingStyle: s.id }); toast(`Teaching style: ${s.id}`, "info"); }} aria-pressed={profile.teachingStyle === s.id} className={cn("flex w-full items-center justify-between rounded-xl border-2 p-3 text-left", profile.teachingStyle === s.id ? "border-oxford bg-oxford-50" : "border-line")}><span><span className="block text-sm font-medium">{s.id}</span><span className="text-xs text-slate-500">{s.desc}</span></span></button>)}</div></Card></div>}
      {tab === "notify" && <Card><CardHeader title={<span className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</span>} /><div className="divide-y divide-line px-5 pb-2"><Row k="reminders" l="Study reminders" d="Daily at 5:00 PM (simulated)" /><Row k="weekly" l="Weekly progress summary" /><Row k="streak" l="Streak alerts" /><Row k="parent" l="Share summaries with my parent" d="Parents see progress, never your private chats" /></div></Card>}
      {tab === "access" && <div className="space-y-5"><Card><CardHeader title={<span className="flex items-center gap-2"><Moon className="h-4 w-4" />Theme</span>} /><div className="flex gap-3 p-5">{(["light", "dark"] as const).map((t) => <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("flex-1 rounded-xl border-2 p-4 capitalize", theme === t ? "border-oxford bg-oxford-50 text-oxford" : "border-line")}>{t}</button>)}</div></Card>
        <Card><CardHeader title={<span className="flex items-center gap-2"><Accessibility className="h-4 w-4" />Accessibility</span>} /><div className="divide-y divide-line px-5 pb-2"><Row k="largeText" l="Larger text" /><Row k="reduceMotion" l="Reduce motion" d="Preference saved; prototype animations are already subtle" /><Row k="highContrast" l="High contrast" d="Coming soon in prototype" /></div></Card></div>}
      {tab === "privacy" && <div className="space-y-5"><Card><CardHeader title={<span className="flex items-center gap-2"><Shield className="h-4 w-4" />Privacy</span>} /><div className="divide-y divide-line px-5 pb-2"><Row k="share" l="Help improve CARAWIN with anonymised usage" d="Off by default" /></div><div className="p-5 pt-3"><Button variant="danger" onClick={resetDemo}><RotateCcw className="h-4 w-4" />Reset demo data on this device</Button></div></Card>
        <Card><CardHeader title={<span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" />Help and support</span>} /><div className="p-5"><Accordion items={[{ id: "1", title: "Is the AI teacher real?", content: "No. This is a frontend prototype with scripted, simulated responses." }, { id: "2", title: "Where is my data stored?", content: "Only in your browser's local storage on this device. Nothing is sent to a server." }, { id: "3", title: "How do I switch to the parent view?", content: "Use the 'Prototype Demo' menu in the top bar to switch role." }]} /></div></Card></div>}
    </div>
  );
}
