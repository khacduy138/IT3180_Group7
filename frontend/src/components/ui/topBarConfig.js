import {
  LayoutDashboard,
  BookUser,
  Banknote,
  Receipt,
  Home,
  Wallet,
  FileBarChart,
  Tag,
} from "lucide-react";

export const TOP_BAR_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "accountant"],
  },
  {
    label: "Người dùng",
    path: "/users",
    icon: BookUser,
    allowedRoles: ["admin"],
  },
  {
    label: "Hộ gia đình",
    path: "/households",
    icon: Home,
    allowedRoles: ["admin", "staff"],
  },
  {
    label: "Hóa đơn",
    path: "/billing",
    icon: Receipt,
    allowedRoles: ["admin", "accountant"],
  },
  {
    label: "Thanh toán",
    path: "/payments",
    icon: Wallet,
    allowedRoles: ["admin", "accountant"],
  },
  {
    label: "Đợt thu",
    path: "/fees",
    icon: Banknote,
    allowedRoles: ["admin", "accountant"],
  },
  {
    label: "Loại phí",
    path: "/fee-types",
    icon: Tag,
    allowedRoles: ["admin", "accountant"],
  },
  {
    label: "Báo cáo",
    path: "/reports",
    icon: FileBarChart,
    allowedRoles: ["admin", "accountant"],
  },
];
