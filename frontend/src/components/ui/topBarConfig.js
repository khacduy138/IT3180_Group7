import { LayoutDashboard, Settings, BookUser, Banknote , Receipt } from "lucide-react";
//import { path } from "../../../../backend/src/server";

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
    label: "Bills",
    path: "/billing",
    icon: Receipt,
    allowedRoles: ["admin", "manager", "customer"],
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
  }
];