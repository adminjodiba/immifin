export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch("https://www.googleapis.com");

    return Response.json({
      status: response.status,
      ok: response.ok,
    });
  } catch (error: any) {
    return Response.json({
      error: error.message,
    });
  }
}
