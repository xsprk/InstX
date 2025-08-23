- import db from "@/src/lib/db"
+ import db from "@/lib/db"// src/app/api/admin/visits/route.ts
import { NextResponse } from "next/server";
import { getVisits } from "@/src/lib/db"; // <-- adjust this to your db helper

export async function GET(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (key !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getVisits();
  return NextResponse.json({ rows });
}
