import { NextResponse } from "next/server";
import { HTTPError } from "@/lib/errors";
import { makeErrorResponse, makeSuccessResponse } from "@/lib/http";
import { INSTAGRAM_CONFIGS } from "@/features/instagram/constants";
import { getPostIdFromUrl } from "@/features/instagram/utils";

async function fetchPostData(postId: string) {
  const res = await fetch(`https://www.instagram.com/p/${postId}/?__a=1&__d=dis`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) throw new HTTPError("Failed to fetch Instagram data", res.status);

  const data = await res.json();
  const media = data.graphql.shortcode_media;

  if (media.__typename === "GraphVideo") {
    return { type: "video", urls: [media.video_url] };
  } else if (media.__typename === "GraphImage") {
    return { type: "image", urls: [media.display_url] };
  } else if (media.__typename === "GraphSidecar") {
    return {
      type: "carousel",
      urls: media.edge_sidecar_to_children.edges.map((edge: any) =>
        edge.node.is_video ? edge.node.video_url : edge.node.display_url
      ),
    };
  }

  throw new HTTPError("Unsupported post type", 400);
}

function handleError(error: any) {
  if (error instanceof HTTPError) {
    const response = makeErrorResponse(error.message);
    return NextResponse.json(response, { status: error.status });
  } else {
    console.error(error);
    const response = makeErrorResponse();
    return NextResponse.json(response, { status: 500 });
  }
}

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

  const postId = await getPostIdFromUrl(postUrl);
  if (!postId) {
    const noPostIdResponse = makeErrorResponse("Invalid Post URL");
    return NextResponse.json(noPostIdResponse, { status: 400 });
  }

  try {
    const postJson = await fetchPostData(postId);
    const response = makeSuccessResponse(postJson);
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return handleError(error);
  }
}
