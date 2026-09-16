import { ShareFeedbackPage } from "@/components/feedback/ShareFeedbackPage";
import { createMetadata } from "@/lib/metadata";

const pageMetadata = createMetadata({
  title: "Share Your Feedback",
  description:
    "Share your IMMIFIN experience. Your feedback helps us improve the tools we build for immigrants navigating life in America.",
  path: "/about/share-feedback",
});

export const metadata = {
  ...pageMetadata,
  robots: {
    index: false,
    follow: true,
  },
};

export default function ShareYourFeedbackRoute() {
  return <ShareFeedbackPage />;
}
