import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  UserRoundCog,
  Pill,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Clinic",
    items: [
      { label: "Patients", to: "/patients", icon: Users },
      { label: "Appointments", to: "/appointments", icon: CalendarDays },
      { label: "Consultations", to: "/consultations", icon: Stethoscope },
      { label: "Doctors", to: "/doctors", icon: UserRoundCog },
      { label: "Prescriptions", to: "/prescriptions", icon: Pill },
      { label: "Payments", to: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", to: "/reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", to: "/admin/users", icon: UserCog },
      { label: "Roles", to: "/admin/roles", icon: Shield },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];
