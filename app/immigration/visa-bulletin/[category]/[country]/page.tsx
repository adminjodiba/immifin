import { notFound } from "next/navigation";
import { Ds2DataPageShell } from "@/components/ds2/Ds2DataPageShell";
import { VisaBulletinPublicAnswer } from "@/components/VisaBulletinPublicAnswer";
import { createMetadata } from "@/lib/metadata";
import { getPublicVisaBulletinAnswer } from "@/lib/visaBulletinPublicAnswer";
import {
  getPublicVisaBulletinCanonicalPath,
  getPublicVisaBulletinCategoryConfig,
  getPublicVisaBulletinCountryConfig,
  listPublicVisaBulletinStaticParams,
} from "@/lib/visaBulletinPublicSlugs";

export const revalidate = 86400;
export const dynamicParams = true;

type PublicVisaBulletinSearchPageProps = {
  params: Promise<{ category: string; country: string }>;
};

export function generateStaticParams() {
  return listPublicVisaBulletinStaticParams();
}

export async function generateMetadata({ params }: PublicVisaBulletinSearchPageProps) {
  const { category, country } = await params;
  const categoryConfig = getPublicVisaBulletinCategoryConfig(category);
  const countryConfig = getPublicVisaBulletinCountryConfig(country);
  const path = getPublicVisaBulletinCanonicalPath(category, country);

  if (!categoryConfig || !countryConfig || !path) {
    notFound();
  }

  return createMetadata({
    title: `${categoryConfig.displayLabel} ${countryConfig.displayLabel} Priority Date and Visa Bulletin`,
    description: `Current employment-based Final Action Date and Date for Filing for ${categoryConfig.displayLabel} ${countryConfig.displayLabel}, plus recent Visa Bulletin movement.`,
    path,
  });
}

export default async function PublicVisaBulletinSearchPage({
  params,
}: PublicVisaBulletinSearchPageProps) {
  const { category, country } = await params;
  const answer = await getPublicVisaBulletinAnswer({
    categorySlug: category,
    countrySlug: country,
  });

  if (!answer) {
    notFound();
  }

  return (
    <Ds2DataPageShell>
      <VisaBulletinPublicAnswer answer={answer} />
    </Ds2DataPageShell>
  );
}
