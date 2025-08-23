import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    await supabase.from("visits").insert([
      {
        ip: payload.ip || null,
        userAgent: payload.userAgent || null,
        location: payload.location || null,
        isp: payload.isp || null,
      },
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
