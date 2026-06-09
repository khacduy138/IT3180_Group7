import {
  LayoutDashboard,
  BookUser,
  Banknote,
  Receipt,
  Home,
  Wallet,
  History,
} from "lucide-react";

export const TOP_BAR_ITEMS = [
  {
    label: "Người dùng",
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
    label: "Hóa đơn",
    path: "/billing",
    icon: Receipt,
    allowedRoles: ["admin", "manager", "customer"],
  },
  {
    label: "Thanh toán",
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
    allowedRoles: ["admin", "manager", "accountant"],
  }
];
