import { NextRequest, NextResponse } from "next/server";
import UAParser from "ua-parser-js";

export async function GET(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "Unknown";

  const userAgent = req.headers.get("user-agent") || "Unknown";
  const parser = new UAParser(userAgent);
  const deviceInfo = parser.getResult();

  let geo = null;
  if (ip !== "Unknown") {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      geo = await res.json();
    } catch (err) {
      geo = { error: "Geo lookup failed" };
    }
  }

  const logData = {
    ip,
    browser: deviceInfo.browser?.name,
    os: deviceInfo.os?.name,
    device: deviceInfo.device?.model || "Desktop",
    location: geo ? `${geo.city}, ${geo.region}, ${geo.country_name}` : "Unknown",
    isp: geo?.org || "Unknown",
    time: new Date().toISOString(),
  };

  console.log("User Log:", logData);

  return NextResponse.json({ status: "ok" });
}
