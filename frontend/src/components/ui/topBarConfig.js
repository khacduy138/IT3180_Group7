import {
  LayoutDashboard,
  Settings,
  BookUser,
  Banknote,
  Receipt,
  Home,
  Wallet,
  History,
} from "lucide-react";

export const TOP_BAR_ITEMS = [
  {
    label: "Users",
    path: "/users",
    icon: BookUser,
    allowedRoles: ["admin", "manager"],
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "customer"],
  },
  {
    label: "Hộ gia đình",
    path: "/households",
    icon: Home,
    allowedRoles: ["admin", "manager", "customer"],
  },
  {
    label: "Bills",
    path: "/billing",
    icon: Receipt,
    allowedRoles: ["admin", "manager", "customer"],
  },
  {
    label: "Payments",
    path: "/payments",
    icon: Wallet,
    allowedRoles: ["admin", "manager", "accountant"],
  },
  {
    label: "History",
    path: "/payments/history",
    icon: History,
    allowedRoles: ["admin", "manager", "accountant"],
  },
  {
    label: "Fees",
    path: "/fees",
    icon: Banknote,
    allowedRoles: ["admin"],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    allowedRoles: ["admin", "manager", "customer"],
  },
];
