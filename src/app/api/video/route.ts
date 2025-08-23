import { NextResponse } from "next/server";
import { HTTPError } from "@/lib/errors";
import { makeErrorResponse, makeSuccessResponse } from "@/lib/http";
import { INSTAGRAM_CONFIGS } from "@/features/instagram/constants";
import {
  fetchAndNormalizeInstagramMedia,
  isValidInstagramURL,
} from "@/features/instagram/utils";

export async function GET(request: Request) {
  if (!INSTAGRAM_CONFIGS.enableServerAPI) {
    const notImplementedResponse = makeErrorResponse("Not Implemented");
    return NextResponse.json(notImplementedResponse, { status: 501 });
  }

  const postUrl = new URL(request.url).searchParams.get("postUrl");
  if (!postUrl) {
    const badRequestResponse = makeErrorResponse("Post URL is required");
    return NextResponse.json(badRequestResponse, { status: 400 });
  }

  const err = isValidInstagramURL(postUrl);
  if (err) {
    const invalidResponse = makeErrorResponse(err);
    return NextResponse.json(invalidResponse, { status: 400 });
  }

  try {
    const items = await fetchAndNormalizeInstagramMedia(postUrl);

    if (!items || items.length === 0) {
      const notFound = makeErrorResponse("No downloadable media found");
      return NextResponse.json(notFound, { status: 404 });
    }

    const response = makeSuccessResponse({ items });
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    if (error instanceof HTTPError) {
      const httpErrorResponse = makeErrorResponse(error.message);
      return NextResponse.json(httpErrorResponse, { status: error.status });
    }

    const unknownErrorResponse = makeErrorResponse(
      error?.message || "Unable to fetch Instagram media"
    );
    return NextResponse.json(unknownErrorResponse, { status: 500 });
  }
}
