import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const searchParams = request.nextUrl.searchParams;
  const crop_type = searchParams.get("crop_type") || "";
  const disease = searchParams.get("disease") || "";

  // Inside Docker, frontend container talks to "backend" service, not "localhost"
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const internalApiUrl = API_URL.replace("localhost", "backend");
  const backendUrl = new URL(`${internalApiUrl}/api/v1/predictions/export`);
  if (crop_type) backendUrl.searchParams.set("crop_type", crop_type);
  if (disease) backendUrl.searchParams.set("disease", disease);

  try {
    const res = await fetch(backendUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch CSV from backend", {
        status: res.status,
      });
    }

    const csvData = await res.text();

    // Use the filename from the URL path (e.g. "krishi_predictions_20260717.csv")
    const safeName = filename.endsWith(".csv") ? filename : `${filename}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error proxying CSV export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
