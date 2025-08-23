import { NextResponse } from "next/server";

type Visit = {
  ip: string;
  userAgent: string;
  consent: boolean;
  when: string;
  city?: string;
  region?: string;
  country?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const consent = !!body?.consent;              // must be true
    if (!consent) return NextResponse.json({ ok: false, error: "No consent" }, { status: 400 });

    // Best-available IP on Vercel
    const ipHeader = req.headers.get("x-forwarded-for") || "";
    const ip = ipHeader.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // OPTIONAL: rough geolocation (city-level only)
    let city, region, country;
    try {
      if (ip !== "unknown" && !ip.startsWith("::1") && !ip.startsWith("127.")) {
        const g = await fetch(`https://ipapi.co/${ip}/json/`, { cache: "no-store" }).then(r => r.json());
        city = g?.city; region = g?.region; country = g?.country_name;
      }
    } catch {}

    const visit: Visit = {
      ip, userAgent, consent: true, when: new Date().toISOString(), city, region, country
    };

    // Save to your DB (example: Supabase REST)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const table = "visits";

    const resp = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(visit)
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ ok: false, error: t }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
