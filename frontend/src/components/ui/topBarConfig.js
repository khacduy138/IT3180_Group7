import { LayoutDashboard, Settings, BookUser, Banknote, Receipt, Home } from "lucide-react";

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
    label: "Loại phí",
    path: "/fees/types",
    icon: Banknote,
    allowedRoles: ["admin"],
  },
  {
    label: "Đợt thu phí",
    path: "/fees/periods",
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