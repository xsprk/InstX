// src/app/api/video/route.ts
import { saveVisit } from "@/lib/db";
import { NextResponse } from "next/server";
import { HTTPError } from "@/lib/errors";
import { makeErrorResponse, makeSuccessResponse } from "@/lib/http";
import { INSTAGRAM_CONFIGS } from "@/features/instagram/constants";
import {
  fetchAndNormalizeInstagramMedia,
  isValidInstagramURL,
} from "@/features/instagram/utils";
import UAParser from "ua-parser-js";

export async function GET(request: Request) {
  if (!INSTAGRAM_CONFIGS.enableServerAPI) {
    return NextResponse.json(makeErrorResponse("Not Implemented"), { status: 501 });
  }

  const postUrl = new URL(request.url).searchParams.get("postUrl");
  if (!postUrl) {
    return NextResponse.json(makeErrorResponse("Post URL is required"), { status: 400 });
  }

  const err = isValidInstagramURL(postUrl);
  if (err) {
    return NextResponse.json(makeErrorResponse(err), { status: 400 });
  }

  // Extract client info
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const uaHeader = request.headers.get("user-agent") || "";
  const parser = new UAParser(uaHeader);
  const uaResult = parser.getResult();

  // Save visit
  await saveVisit({
    time: new Date().toISOString(),
    ip,
    url: postUrl,
    browser: uaResult.browser.name || "unknown",
    os: uaResult.os.name || "unknown",
    device: uaResult.device.model || uaResult.device.type || "unknown",
  });

  try {
    const items = await fetchAndNormalizeInstagramMedia(postUrl);

    if (!items || items.length === 0) {
      return NextResponse.json(makeErrorResponse("No downloadable media found"), { status: 404 });
    }

    return NextResponse.json(makeSuccessResponse({ items }), { status: 200 });
  } catch (error: any) {
    if (error instanceof HTTPError) {
      return NextResponse.json(makeErrorResponse(error.message), { status: error.status });
    }
    return NextResponse.json(makeErrorResponse(error?.message || "Unable to fetch Instagram media"), { status: 500 });
  }
}
