import { NextRequest, NextResponse } from "next/server";
import UAParser from "ua-parser-js";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") || req.ip || "Unknown";
  const userAgent = req.headers.get("user-agent") || "Unknown";

  const parser = new UAParser(userAgent);
  const deviceInfo = parser.getResult();

  const logData = {
    ip,
    browser: deviceInfo.browser?.name,
    os: deviceInfo.os?.name,
    device: deviceInfo.device?.model || "Desktop",
    time: new Date().toISOString(),
  };

  console.log("User Log:", logData);

  return NextResponse.json({ status: "ok" });
}
