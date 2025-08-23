// lib/db.ts
// A clean db helper that:
//  - exports a PrismaClient as default (if you use Prisma elsewhere)
//  - provides file-backed saveVisit/getVisits for simple visits storage
// This avoids the malformed JSON block that was previously present.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();
export default db;

// Store visits as JSON in <project-root>/data/visits.json
const filePath = path.join(process.cwd(), "data", "visits.json");

/**
 * Save a visit row to data/visits.json
 * row: any object (e.g. { ua: '...', time: new Date().toISOString() })
 */
export async function saveVisit(row: any) {
  try {
    // ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    let data: any[] = [];
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!Array.isArray(data)) data = [];
    }
    data.push(row);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return row;
  } catch (err) {
    throw err;
  }
}

/** Return the list of saved visits (or [] if none) */
export async function getVisits() {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw err;
  }
}
