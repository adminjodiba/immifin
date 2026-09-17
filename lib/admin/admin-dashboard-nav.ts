/**
 * Approved Admin Dashboard information architecture (S7A-DS2-ADMIN-DASHBOARD-MOCK-001).
 * Navigation only. Menu visibility is not authorization — routes stay requireAdmin().
 */

export const ADMIN_DASHBOARD_NAV_LABEL = "Admin Dashboard";
export const ADMIN_DASHBOARD_OVERVIEW_PATH = "/admin/overview";

export const ADMIN_DASHBOARD_SECTIONS = [
  {
    id: "overview",
    href: "/admin/overview",
    label: "Overview",
    description: "Monitor IMMIFIN platform health, manage users, and keep data up to date.",
  },
  {
    id: "users",
    href: "/admin/users",
    label: "User Management",
    description: "View, edit, and manage user accounts.",
  },
  {
    id: "feedback",
    href: "/admin/feedback",
    label: "User Feedback",
    description: "Review and respond to user feedback.",
  },
  {
    id: "data-refresh",
    href: "/admin/data-refresh",
    label: "Data Refresh Center",
    description: "Update immigration and wage datasets.",
  },
  {
    id: "notifications",
    href: "/admin/notifications",
    label: "Notify User Group",
    description: "Publish updates to users.",
  },
  {
    id: "content",
    href: "/admin/content",
    label: "Content Management",
    description: "Manage IMMIFIN administrative content.",
  },
  {
    id: "logs",
    href: "/admin/logs",
    label: "System Logs",
    description: "Internal operations and system logs.",
  },
  {
    id: "settings",
    href: "/admin/settings",
    label: "Settings",
    description: "Admin settings for the IMMIFIN platform.",
  },
] as const;

export type AdminDashboardSectionId = (typeof ADMIN_DASHBOARD_SECTIONS)[number]["id"];

export function isAdminDashboardSectionId(value: string): value is AdminDashboardSectionId {
  return ADMIN_DASHBOARD_SECTIONS.some((section) => section.id === value);
}

export function getAdminDashboardSection(id: AdminDashboardSectionId) {
  return ADMIN_DASHBOARD_SECTIONS.find((section) => section.id === id)!;
}
