import { NextResponse } from "next/server";
import {
  filterVisaStampingSheetRecords,
  getVisaStampingSheetData,
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
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!isVisaType(visaTypeParam)) {
    return NextResponse.json({ error: "Invalid or missing visaType parameter." }, { status: 400 });
  }

  const appointmentType: VisaStampingAppointmentType = isAppointmentType(appointmentTypeParam)
    ? appointmentTypeParam
    : "Interview";

  try {
    const sheetData = await getVisaStampingSheetData({ forceRefresh });
    const filtered = filterVisaStampingSheetRecords(sheetData.records, {
      country: country === "Worldwide" ? "Worldwide" : country,
      visaType: visaTypeParam,
      appointmentType: appointmentType === "Drop-box" ? undefined : appointmentType,
    });

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
        refreshed: forceRefresh || undefined,
        ...(appointmentType === "Drop-box" ? { appointmentTypeNote: DROPBOX_NOTE } : {}),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load visa stamping wait times";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
