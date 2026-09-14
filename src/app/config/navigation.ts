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
  Building2,
  DoorOpen,
  Wrench,
  BedDouble,
  FlaskConical,
  CalendarRange,
  Bell,
  ScrollText,
  HeartPulse,
  UserRound,
  HardHat,
  PanelsTopLeft,
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
  icon: LucideIcon;
  items: NavItem[];
}

/**
 * Navigation interne SolidCare — Healthcare Operations Platform.
 * People + Spaces + Resources + Care. Aucun portail patient public.
 */
export const navigation: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    icon: PanelsTopLeft,
    items: [
      { label: "Tableau de bord", to: "/dashboard", icon: LayoutDashboard },
      { label: "Alertes", to: "/alerts", icon: Bell },
      { label: "Planning", to: "/planning", icon: CalendarRange },
    ],
  },
  {
    label: "Soins",
    icon: Stethoscope,
    items: [
      { label: "Patients", to: "/patients", icon: Users },
      { label: "Rendez-vous", to: "/appointments", icon: CalendarDays },
      { label: "Consultations", to: "/consultations", icon: Stethoscope },
      { label: "Examens", to: "/examinations", icon: FlaskConical },
      { label: "Ordonnances", to: "/prescriptions", icon: Pill },
      { label: "Hospitalisations", to: "/hospitalizations", icon: HeartPulse },
      { label: "Paiements", to: "/payments", icon: CreditCard },
    ],
  },
  {
    label: "Organisation",
    icon: Building2,
    items: [
      { label: "Départements", to: "/departments", icon: Building2 },
      { label: "Salles", to: "/rooms", icon: DoorOpen },
      { label: "Chambres & lits", to: "/wards", icon: BedDouble },
      { label: "Matériel", to: "/equipment", icon: Wrench },
      { label: "Maintenance", to: "/maintenance", icon: HardHat },
    ],
  },
  {
    label: "Personnel",
    icon: Users,
    items: [
      { label: "Médecins", to: "/doctors", icon: UserRoundCog },
      { label: "Personnel soignant", to: "/staff", icon: UserRound },
    ],
  },
  {
    label: "Analyses",
    icon: BarChart3,
    items: [{ label: "Rapports", to: "/reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    icon: Shield,
    items: [
      { label: "Utilisateurs", to: "/admin/users", icon: UserCog },
      { label: "Rôles", to: "/admin/roles", icon: Shield },
      { label: "Audit", to: "/admin/audit", icon: ScrollText },
      { label: "Paramètres", to: "/admin/settings", icon: Settings },
    ],
  },
];
