// lib/db.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Prisma client (still available for other DB operations)
const db = new PrismaClient();
export default db;

// File path inside /data folder
const filePath = path.join(process.cwd(), "data", "visits.json");

// helper to read JSON file safely
function readJson(file: string): any[] {
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// helper to write JSON file safely
function writeJson(file: string, data: any[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// Save a visit into /data/visits.json
export async function saveVisitData(row: any) {
  const data = readJson(filePath);
  data.push(row);
  writeJson(filePath, data);
  return row;
}

// Get all visits from /data/visits.json
export async function getVisitsData() {
  return readJson(filePath);
}
