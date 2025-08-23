import { NextResponse } from "next/server";

type Geo = {
  city?: string; region?: string; country_name?: string; org?: string;
};

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  return xr || "Unknown";
}

function parseUA(ua: string | null) {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  // Very light parsing to avoid extra libs (ua-parser-js)
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isChrome = /Chrome\/\d+/i.test(ua);
  const isSafari = /Safari\/\d+/i.test(ua) && !/Chrome\/\d+/i.test(ua);
  const isFirefox = /Firefox\/\d+/i.test(ua);

  const browser = isChrome ? "Chrome" : isSafari ? "Safari" : isFirefox ? "Firefox" : "Other";
  const os = isAndroid ? "Android" : isIOS ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS X/i.test(ua) ? "macOS" : "Other";

  // crude device model extraction (Android user agents often contain model)
  const modelMatch = ua.match(/\((?:[^;]*;){2}\s*([^;)]+)\)/); // grabs the 3rd semicolon segment sometimes
  const device = modelMatch?.[1]?.trim() || (isAndroid || isIOS ? "Mobile" : "Desktop");

  return { browser, os, device };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url") || "";
    const ip = getClientIp(request);
    const ua = request.headers.get("user-agent");
    const uaInfo = parseUA(ua);

    let geo: Geo | null = null;
    if (ip && ip !== "Unknown" && !ip.startsWith("::1")) {
      try {
        // You can swap to a paid provider for better accuracy if you want.
        const resp = await fetch(`https://ipapi.co/${ip}/json/`, { cache: "no-store" });
        if (resp.ok) geo = await resp.json() as Geo;
      } catch {}
    }

    // Save to your datastore (see section 3); for now return JSON so you can verify
    const payload = {
      time: new Date().toISOString(),
      ip,
      url,
      browser: uaInfo.browser,
      os: uaInfo.os,
      device: uaInfo.device,
      location: geo ? `${geo.city ?? ""}${geo.city ? ", " : ""}${geo.region ?? ""}${geo.region ? ", " : ""}${geo.country_name ?? ""}` : "Unknown",
      isp: (geo as any)?.org ?? "Unknown",
    };

    // TODO: replace this with a call to your DB insert function
    // await saveVisit(payload);

    return NextResponse.json({ ok: true, data: payload }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
