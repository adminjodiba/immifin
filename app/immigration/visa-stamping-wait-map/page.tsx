import { Ds2DataPageShell } from "@/components/ds2/Ds2DataPageShell";
import { VisaStampingWaitMap } from "@/components/VisaStampingWaitMap";
import { VisaStampingWaitMapSeoContent } from "@/components/VisaStampingWaitMapSeoContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B & U.S. Visa Appointment Wait Times",
  description:
    "Compare U.S. visa appointment wait-time estimates by consulate, including H-1B petition-based estimates, India locations, and historical trends using Department of State data.",
  path: "/immigration/visa-stamping-wait-map",
});

export default function VisaStampingWaitMapPage() {
  return (
    <Ds2DataPageShell>
      <VisaStampingWaitMap />
      <VisaStampingWaitMapSeoContent />
    </Ds2DataPageShell>
  );
}
