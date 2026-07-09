import { NextResponse } from "next/server";
import {
  attachHistoryPointsForPost,
  filterVisaStampingSheetRecords,
  getVisaStampingHistoryRows,
  getVisaStampingSheetData,
  stripHistoryPointsFromPosts,
} from "@/lib/visa/visaStampingSheetService";
import {
  formatDisplayDate,
  VISA_STAMPING_APPOINTMENT_TYPES,
  VISA_STAMPING_VISA_TYPES,
  type VisaStampingAppointmentType,
  type VisaStampingVisaType,
} from "@/lib/visa/visaStampingWaitTimes";

export const runtime = "nodejs";
export const revalidate = 86_400;

const DROPBOX_NOTE =
  "Interview waiver/dropbox-specific data is not separately available in the current sheet.";

function isVisaType(value: string | null): value is VisaStampingVisaType {
  return value !== null && (VISA_STAMPING_VISA_TYPES as readonly string[]).includes(value);
}

function isAppointmentType(value: string | null): value is VisaStampingAppointmentType {
  return value !== null && (VISA_STAMPING_APPOINTMENT_TYPES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim() || "India";
  const visaTypeParam = searchParams.get("visaType");
  const appointmentTypeParam = searchParams.get("appointmentType");
  const includeHistory = searchParams.get("includeHistory") === "true";
  const historyCity = searchParams.get("city")?.trim() || "";

  if (!isVisaType(visaTypeParam)) {
    return NextResponse.json({ error: "Invalid or missing visaType parameter." }, { status: 400 });
  }

  const appointmentType: VisaStampingAppointmentType = isAppointmentType(appointmentTypeParam)
    ? appointmentTypeParam
    : "Interview";

  try {
    // Force refresh is admin-only via POST /api/admin/refresh-visa-stamping.
    const sheetData = await getVisaStampingSheetData();
    let filtered = filterVisaStampingSheetRecords(sheetData.records, {
      country: country === "Worldwide" ? "Worldwide" : country,
      visaType: visaTypeParam,
      appointmentType: appointmentType === "Drop-box" ? undefined : appointmentType,
    });

    // Default map payload: trend summary only — no full historyPoints series.
    filtered = stripHistoryPointsFromPosts(filtered);

    if (includeHistory) {
      if (!historyCity) {
        return NextResponse.json(
          { error: "city is required when includeHistory=true." },
          { status: 400 },
        );
      }

      const cityKey = historyCity.toLowerCase();
      const targetPost = filtered.find((post) => post.city.trim().toLowerCase() === cityKey);

      if (!targetPost) {
        return NextResponse.json(
          { error: `No consulate found for city "${historyCity}" with the selected filters.` },
          { status: 404 },
        );
      }

      // Reuse cached history rows — do not re-fetch/parse the history CSV.
      const historyRows = await getVisaStampingHistoryRows();
      const [withHistory] = attachHistoryPointsForPost([targetPost], {
        city: historyCity,
        visaType: visaTypeParam,
        historyRows,
      });

      const data =
        appointmentType === "Drop-box"
          ? [{ ...withHistory!, appointmentType: "Drop-box" as const }]
          : [withHistory!];

      return NextResponse.json({
        data,
        metadata: {
          source: sheetData.source,
          lastUpdated: formatDisplayDate(sheetData.lastUpdated),
          lastUpdatedIso: sheetData.lastUpdated,
          count: data.length,
          countries: sheetData.countries,
          history: sheetData.history,
          includeHistory: true,
          ...(appointmentType === "Drop-box" ? { appointmentTypeNote: DROPBOX_NOTE } : {}),
        },
      });
    }

    const data =
      appointmentType === "Drop-box"
        ? filtered.map((post) => ({ ...post, appointmentType: "Drop-box" as const }))
        : filtered;

    return NextResponse.json({
      data,
      metadata: {
        source: sheetData.source,
        lastUpdated: formatDisplayDate(sheetData.lastUpdated),
        lastUpdatedIso: sheetData.lastUpdated,
        count: data.length,
        countries: sheetData.countries,
        history: sheetData.history,
        ...(appointmentType === "Drop-box" ? { appointmentTypeNote: DROPBOX_NOTE } : {}),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load visa stamping wait times";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
