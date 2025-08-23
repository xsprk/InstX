// src/app/api/admin/visits/route.ts
import { NextResponse } from "next/server";
import { getVisits } from "@/lib/db";

export async function GET() {
  const visits = await getVisits();
  return NextResponse.json(visits);
}
