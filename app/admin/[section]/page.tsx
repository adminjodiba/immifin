import { notFound } from "next/navigation";
import { AdminDashboardDataRefreshPane } from "@/components/admin/AdminDashboardDataRefreshPane";
import { AdminDashboardOverviewMock } from "@/components/admin/AdminDashboardOverviewMock";
import { AdminDashboardPlaceholder } from "@/components/admin/AdminDashboardPlaceholder";
import { AdminFeedbackReviewQueue } from "@/components/admin/AdminFeedbackReviewQueue";
import { AdminDashboardWorkspaceLayout } from "@/components/admin/AdminSettingWorkspaceLayout";
import {
  getAdminDashboardSection,
  isAdminDashboardSectionId,
} from "@/lib/admin/admin-dashboard-nav";
import { requireAdminPage } from "@/lib/admin/requireAdminPage";
import { createMetadata } from "@/lib/metadata";

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({ params }: AdminSectionPageProps) {
  const { section } = await params;
  if (!isAdminDashboardSectionId(section)) {
    return createMetadata({
      title: "Admin Dashboard",
      description: "IMMIFIN administration.",
      path: "/admin",
    });
  }

  const item = getAdminDashboardSection(section);
  return createMetadata({
    title: `${item.label} · Admin Dashboard`,
    description: item.description,
    path: item.href,
  });
}

export default async function AdminDashboardSectionPage({ params }: AdminSectionPageProps) {
  await requireAdminPage();

  const { section } = await params;
  if (!isAdminDashboardSectionId(section)) {
    notFound();
  }

  return (
    <AdminDashboardWorkspaceLayout adminSection={section}>
      {section === "overview" ? (
        <AdminDashboardOverviewMock />
      ) : section === "data-refresh" ? (
        <AdminDashboardDataRefreshPane />
      ) : section === "feedback" ? (
        <AdminFeedbackReviewQueue />
      ) : (
        <AdminDashboardPlaceholder sectionId={section} />
      )}
    </AdminDashboardWorkspaceLayout>
  );
}
