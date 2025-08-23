import { supabase } from "@/lib/db";
// ...
// after building `payload`:
await supabase.from("visits").insert([{
  time: payload.time,
  ip: payload.ip,
  url: payload.url,
  browser: payload.browser,
  os: payload.os,
  device: payload.device,
  location: payload.location,
  isp: payload.isp,
}]);
return NextResponse.json({ ok: true }, { status: 200 });
