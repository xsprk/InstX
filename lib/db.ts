// lib/db.ts
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "visits.json");

// Get all visits
export async function getVisits() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save a new visit
export async function saveVisit(row: any) {
  const data = await getVisits();
  data.push(row);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return row;
}
