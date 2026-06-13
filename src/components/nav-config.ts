import {
  LayoutDashboard,
  MessageCircleQuestion,
  BookOpen,
  ScanLine,
  TrendingUp,
  Zap,
  Users,
  CalendarDays,
  UserRound,
  FileBarChart,
  Network,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** i18n key under "nav." */
  key: string;
  icon: LucideIcon;
  /** Show in the compact bottom bar on mobile. */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", key: "today", icon: LayoutDashboard, primary: true },
  { href: "/ask", key: "ask", icon: MessageCircleQuestion, primary: true },
  { href: "/ledger", key: "ledger", icon: BookOpen, primary: true },
  { href: "/capture", key: "capture", icon: ScanLine },
  { href: "/cashflow", key: "cashflow", icon: TrendingUp },
  { href: "/actions", key: "actions", icon: Zap, primary: true },
  { href: "/team", key: "team", icon: Users },
  { href: "/schedule", key: "schedule", icon: CalendarDays },
  { href: "/customers", key: "customers", icon: UserRound },
  { href: "/reports", key: "reports", icon: FileBarChart },
  { href: "/network", key: "network", icon: Network },
  { href: "/settings", key: "settings", icon: Settings, primary: true },
];
