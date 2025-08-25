import { NextResponse } from "next/server";

const COMPLETE_API_BASE = process.env.COMPLETE_API_BASE!;   // e.g. https://api.complete.example
const COMPLETE_API_KEY  = process.env.COMPLETE_API_KEY!;    // if your API needs a key

type CompleteItem = {
  url?: string;
  download_url?: string;
  src?: string;
  href?: string;
  type?: string;          // "video" | "image"
  media_type?: string;    // sometimes "video" | "image"
  thumbnail?: string;
  thumb?: string;
  poster?: string;
  display_url?: string;
};

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // 🔁 Call your Complete API (adjust path/method/headers as needed)
    const upstream = await fetch(`${COMPLETE_API_BASE}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(COMPLETE_API_KEY ? { Authorization: `Bearer ${COMPLETE_API_KEY}` } : {})
      },
      body: JSON.stringify({ url })
    });

    if (!upstream.ok) {
      const msg = await upstream.text();
      return NextResponse.json({ error: `Complete API error: ${msg}` }, { status: upstream.status });
    }

    const payload = await upstream.json();

    // Try common shapes the Complete API might return
    const raw: CompleteItem[] =
      payload?.files || payload?.items || payload?.medias || payload?.media || payload?.data || [];

    const files = raw
      .map((i) => {
        const u = i.url || i.download_url || i.src || i.href;
        if (!u) return null;

        const tSrc = (i.media_type || i.type || "").toLowerCase();
        const t = tSrc.includes("video") ? "video" : "image";            // normalise
        const thumbnail = i.thumbnail || i.thumb || i.poster || i.display_url || null;

        return { url: u, media_type: t, thumbnail };
      })
      .filter(Boolean);

    // Always return the unified shape your static page expects
    return NextResponse.json({ files }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
