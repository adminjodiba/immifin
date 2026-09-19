import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublicVisaBulletinCombinations } from "./visaBulletinPublicSlugs";
import {
  generateMetadata,
  generateStaticParams,
} from "../app/immigration/visa-bulletin/[category]/[country]/page";

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? String(error.digest) : "";
  const message = "message" in error ? String(error.message) : "";
  return digest.includes("NEXT_HTTP_ERROR_FALLBACK") || digest.includes("NEXT_NOT_FOUND") || message.includes("NEXT_HTTP_ERROR");
}

describe("public Visa Bulletin search route params", () => {
  it("generateStaticParams returns exactly the 15 canonical combinations", () => {
    const params = generateStaticParams();
    const expected = listPublicVisaBulletinCombinations();

    assert.equal(params.length, 15);
    assert.deepEqual(
      params.map((item) => `${item.category}/${item.country}`).sort(),
      expected.map((item) => `${item.categorySlug}/${item.countrySlug}`).sort(),
    );
  });

  it("generateMetadata covers every valid combination", async () => {
    const params = generateStaticParams();

    for (const pair of params) {
      const metadata = await generateMetadata({
        params: Promise.resolve(pair),
      });

      assert.equal(
        metadata.alternates?.canonical,
        `https://immifin.com/immigration/visa-bulletin/${pair.category}/${pair.country}`,
      );
      assert.deepEqual(metadata.robots, { index: true, follow: true });
    }
  });

  it("generateMetadata uses the approved EB-2 India pattern", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: "eb2", country: "india" }),
    });

    assert.equal(metadata.title, "EB-2 India Priority Date and Visa Bulletin");
    assert.equal(
      metadata.description,
      "Current employment-based Final Action Date and Date for Filing for EB-2 India, plus recent Visa Bulletin movement.",
    );
    assert.equal(
      metadata.alternates?.canonical,
      "https://immifin.com/immigration/visa-bulletin/eb2/india",
    );
    assert.equal(metadata.openGraph?.url, "https://immifin.com/immigration/visa-bulletin/eb2/india");
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    assert.equal(
      typeof metadata.title === "string" && metadata.title.includes("2026"),
      false,
    );
  });
});

describe("public Visa Bulletin invalid route metadata", () => {
  const invalidPairs = [
    { category: "eb4", country: "india" },
    { category: "eb2", country: "canada" },
    { category: "eb-2", country: "india" },
    { category: "eb2", country: "row" },
    { category: "foo", country: "bar" },
  ];

  for (const pair of invalidPairs) {
    it(`calls notFound for ${pair.category}/${pair.country}`, async () => {
      await assert.rejects(
        () =>
          generateMetadata({
            params: Promise.resolve(pair),
          }),
        isNotFoundError,
      );
    });
  }
});
