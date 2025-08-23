import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // server-side only
  { auth: { persistSession: false } }
);
// src/lib/db.ts
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "visits.json");

export async function saveVisit(row: any) {
  let data: any[] = [];
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  data.push(row);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function getVisits() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
