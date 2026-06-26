export const runtime = "nodejs";

function getKeyPrefix(value: string): string {
  const match = value.match(/^(pk|sk)_(test|live)_/);
  return match?.[0] ?? value.slice(0, 8);
}

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY?.trim() ?? "";

  return Response.json({
    publishableKeyPrefix: getKeyPrefix(publishableKey),
    publishableKeyFirst20: publishableKey.slice(0, 20),
    secretKeyPrefix: getKeyPrefix(secretKey),
    secretKeyFirst20: secretKey.slice(0, 20),
    hasPublishableKey: publishableKey.length > 0,
    hasSecretKey: secretKey.length > 0,
  });
}
