// lib/db.ts
import fs from "fs";
import path from "path";

// File path for storing visits
const filePath = path.join(process.cwd(), "data", "visits.json");

// Read visits
export async function getVisitsData() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Save a visit
export async function saveVisitData(row: any) {
  const data = await getVisitsData();
  data.push(row);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return row;
}
