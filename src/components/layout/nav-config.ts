import {
  LayoutDashboard, BookOpenCheck, MessagesSquare, ScanSearch, PenLine, GraduationCap, Library, PlayCircle, CalendarDays,
  LineChart, History, Settings, Users, UserRound, FileBarChart, Bell, Layers, Database, ClipboardList, Bot, Languages,
  Video, School, BookCopy, ListTree, Sparkles, type LucideIcon,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; exact?: boolean; group?: string }

export const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/student/learn", label: "Learn a Chapter", icon: BookOpenCheck },
  { href: "/student/teacher", label: "Talk to My Teacher", icon: MessagesSquare },
  { href: "/student/doubt", label: "Solve My Doubt", icon: ScanSearch },
  { href: "/student/practice", label: "Practise & Test", icon: PenLine },
  { href: "/student/exams", label: "Examination Preparation", icon: GraduationCap },
  { href: "/student/library", label: "My Digital Library", icon: Library },
  { href: "/student/videos", label: "Video Learning", icon: PlayCircle },
  { href: "/student/planner", label: "My Study Planner", icon: CalendarDays },
  { href: "/student/progress", label: "My Progress", icon: LineChart },
  { href: "/student/history", label: "Learning History", icon: History },
  { href: "/student/labs", label: "Learning Labs", icon: Sparkles },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export const PARENT_NAV: NavItem[] = [
  { href: "/parent", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/parent/children", label: "My Children", icon: Users },
  { href: "/parent/activity", label: "Learning Activity", icon: LineChart },
  { href: "/parent/performance", label: "Academic Performance", icon: GraduationCap },
  { href: "/parent/subjects", label: "Subject Analysis", icon: BookCopy },
  { href: "/parent/plan", label: "Study Plan", icon: CalendarDays },
  { href: "/parent/reports", label: "Reports", icon: FileBarChart },
  { href: "/parent/notifications", label: "Notifications", icon: Bell },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/parents", label: "Parents", icon: UserRound },
  { href: "/admin/curriculum", label: "Curriculum Management", icon: ListTree, exact: true },
  { href: "/admin/curriculum/boards", label: "Boards", icon: School, group: "sub" },
  { href: "/admin/curriculum/classes", label: "Classes", icon: Layers, group: "sub" },
  { href: "/admin/curriculum/subjects", label: "Subjects", icon: BookCopy, group: "sub" },
  { href: "/admin/curriculum/chapters", label: "Chapters", icon: BookOpenCheck, group: "sub" },
  { href: "/admin/curriculum/topics", label: "Topics", icon: ListTree, group: "sub" },
  { href: "/admin/content", label: "Digital Content Library", icon: Database },
  { href: "/admin/questions", label: "Question Bank", icon: PenLine },
  { href: "/admin/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/admin/ai-config", label: "AI Teaching Configuration", icon: Bot },
  { href: "/admin/languages", label: "Language Management", icon: Languages },
  { href: "/admin/videos", label: "Video Resources", icon: Video },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
