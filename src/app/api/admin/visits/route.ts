// visits/route.ts
import db, { getVisits } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const visits = await getVisits(db);
    return NextResponse.json(visits);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
