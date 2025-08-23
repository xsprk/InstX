// src/lib/db.ts
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const filePath = path.join(process.cwd(), "visits.json");

// Save a new visit (sync style)
export function saveVisit(row: any) {
  let data: any[] = [];
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  data.push(row);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Get all visits
export function getVisits() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Supabase client (for database if needed)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // server-side only
  { auth: { persistSession: false } }
);
