import {
  LayoutDashboard,
  LineChart,
  HandCoins,
  ReceiptText,
  MessageSquareText,
  Zap,
  ShieldCheck,
  PlugZap,
  CreditCard,
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
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, primary: true },
  { href: "/forecast", key: "forecast", icon: LineChart, primary: true },
  { href: "/collections", key: "collections", icon: HandCoins, primary: true },
  { href: "/payables", key: "payables", icon: ReceiptText },
  { href: "/advisor", key: "advisor", icon: MessageSquareText, primary: true },
  { href: "/actions", key: "actions", icon: Zap, primary: true },
  { href: "/audit", key: "audit", icon: ShieldCheck },
  { href: "/data-sources", key: "dataSources", icon: PlugZap },
  { href: "/pricing", key: "pricing", icon: CreditCard },
  { href: "/settings", key: "settings", icon: Settings },
];
