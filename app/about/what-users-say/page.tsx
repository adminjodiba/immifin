import { WhatUsersSayHero } from "@/components/about/WhatUsersSayHero";
import { WhatUsersSayView } from "@/components/about/WhatUsersSayView";
import { getWhatUsersSayDailySnapshot } from "@/lib/feedback/whatUsersSayService";
import { createMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "What Users Say",
  description:
    "Hear from immigrants using IMMIFIN to plan their journey in America.",
  path: "/about/what-users-say",
});

export default async function WhatUsersSayPage() {
  const snapshot = await getWhatUsersSayDailySnapshot();
  return (
    <>
      <WhatUsersSayHero />
      <WhatUsersSayView snapshot={snapshot} />
    </>
  );
}
