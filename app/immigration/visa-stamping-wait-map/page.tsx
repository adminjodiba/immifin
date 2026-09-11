import { Ds2DataPageShell } from "@/components/ds2/Ds2DataPageShell";
import { VisaStampingWaitMap } from "@/components/VisaStampingWaitMap";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Global Visa Stamping Wait Map",
  description:
    "Compare approximate U.S. visa appointment wait times across embassies and consulates worldwide.",
  path: "/immigration/visa-stamping-wait-map",
});

export default function VisaStampingWaitMapPage() {
  return (
    <Ds2DataPageShell>
      <VisaStampingWaitMap />
    </Ds2DataPageShell>
  );
}
