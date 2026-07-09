import { VisaStampingWaitMap } from "@/components/VisaStampingWaitMap";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Global Visa Stamping Wait Map",
  description:
    "Compare approximate U.S. visa appointment wait times across embassies and consulates worldwide.",
  path: "/immigration/visa-stamping-wait-map",
});

export default function VisaStampingWaitMapPage() {
  return <VisaStampingWaitMap />;
}
