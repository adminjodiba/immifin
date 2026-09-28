import type { Metadata } from "next";
import { VisaStampingWaitMap } from "@/components/VisaStampingWaitMap";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for Visa Stamping Wait Map.
 * Reuses the existing wait-map body. Does not import the production page,
 * SEO content, or Ds2DataPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — Visa Stamping Wait Map",
  description:
    "Temporary Product Owner preview of Visa Stamping Wait Map inside Immigration V4. Not a public page.",
  path: "/immigration-v4/visa-stamping-wait-map",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ImmigrationV4VisaStampingWaitMapPage() {
  return (
    <div className="ds2-imm-v4-body">
      <VisaStampingWaitMap href="/immigration-v4" />
    </div>
  );
}
