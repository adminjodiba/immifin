import { AboutImmifinPage } from "@/components/about/AboutImmifinPage";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "About",
  description:
    "Learn about Immifin — our mission to help immigrants navigate visas, taxes, investing, credit, and citizenship in America.",
  path: "/about",
});

export default function AboutPage() {
  return <AboutImmifinPage />;
}
