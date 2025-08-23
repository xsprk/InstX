import { getTimedFilename } from "@/lib/utils";
import { VideoInfo } from "@/types";
import { MediaData } from "./types";

/** ----------------------------------------------------------------
 * URL parsing & validation
 * ---------------------------------------------------------------*/
export type InstagramUrlInfo = { id: string; type: "post" | "reel" };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const isValidInstagramURL = (postUrl: string): string => {
  try {
    const u = new URL(postUrl);
    const hostOk = /^(?:www\.)?instagram\.com$/.test(u.hostname);
    if (!hostOk) return "Not an instagram.com URL";

    // Accept /p/{id}/, /reel/{id}/, /reels/{id}/ or /share/{token}/ (we will resolve)
    const ok =
      /^\/p\/[A-Za-z0-9_-]+\/?/.test(u.pathname) ||
      /^\/reel[s]?\/[A-Za-z0-9_-]+\/?/.test(u.pathname) ||
      /^\/share\/[A-Za-z0-9_-]+\/?/.test(u.pathname);

    if (!ok) return "URL must be /p/{id} or /reel/{id} or /reels/{id}";
    return "";
  } catch {
    return "Invalid URL";
  }
};

async function resolveShareIfNeeded(postUrl: string): Promise<string> {
  // If it's a share link, let Instagram redirect us to the final URL,
  // then parse the resulting /p/{id} or /reel/{id}
  const shareRegex = /^https:\/\/(?:www\.)?instagram\.com\/share\/([a-zA-Z0-9_-]+)\/?/;
  if (!shareRegex.test(postUrl)) return postUrl;

  const res = await fetch(postUrl, {
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  // If fetch follows to a final URL, use it; fallback to original
  return res.url || postUrl;
}

export const parseInstagramUrl = async (postUrl: string): Promise<InstagramUrlInfo> => {
  const err = isValidInstagramURL(postUrl);
  if (err) throw new Error(err);

  const finalUrl = await resolveShareIfNeeded(postUrl);

  const postMatch = finalUrl.match(
    /^https:\/\/(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/
  );
  if (postMatch) return { id: postMatch[1], type: "post" };

  const reelMatch = finalUrl.match(
    /^https:\/\/(?:www\.)?instagram\.com\/reels?\/([A-Za-z0-9_-]+)\/?/
  );
  if (reelMatch) return { id: reelMatch[1], type: "reel" };

  throw new Error("Invalid Instagram URL. Expected /p/{id} or /reel/{id}.");
};

export const getPathForInstagramInfo = (info: InstagramUrlInfo): string =>
  info.type === "reel" ? `reel/${info.id}` : `p/${info.id}`;

/** ----------------------------------------------------------------
 * Normalized media type for API consumers
 * ---------------------------------------------------------------*/
export type NormalizedMedia =
  | {
      kind: "video";
      url: string;
      width?: number;
      height?: number;
      filename: string;
    }
  | {
      kind: "image";
      url: string;
      width?: number;
      height?: number;
      filename: string;
    };

export const getIGVideoFileName = () => getTimedFilename("ig-downloader", "mp4");
export const getIGImageFileName = () => getTimedFilename("ig-image", "jpg");

/** ----------------------------------------------------------------
 * Page JSON fetch (first try) and GraphQL fallback
 * ---------------------------------------------------------------*/
async function fetchPageJSON(path: string) {
  const url = `https://www.instagram.com/${path}/?__a=1&__d=dis`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json,text/*;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Page JSON fetch failed: ${res.status}`);
  return res.json();
}

/**
 * GraphQL body used by instagram.com web client for post details.
 * NOTE: doc_id & shape can change over time. If it breaks, update here.
 */
export const encodeGraphqlRequestData = (shortcode: string) => {
  // This payload mirrors the web client “PolarisPost…” query variables.
  return {
    av: "0",
    __d: "www",
    __user: "0",
    __a: "1",
    __req: "1",
    __hs: "19624.HYP:instagram_web_pkg.2.1..0.0",
    dpr: "1",
    __ccg: "UNKNOWN",
    __rev: "1008824440",
    __hsi: "0",
    __dyn:
      "7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78-0iS2S2e1FwnU1eE48hxG1pg661pwr86C1mwraCw",
    __csr: "",
    __comet_req: "7",
    lsd: "AVqbxe3J_YA",
    jazoest: "2957",
    __spin_r: "1008824440",
    __spin_b: "trunk",
    __spin_t: "1695523385",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
    variables: JSON.stringify({
      shortcode,
      fetch_comment_count: 0,
      fetch_related_profile_media_count: 0,
      parent_comment_count: 0,
      child_comment_count: 0,
      has_threaded_comments: true,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    }),
    // doc_id used by the web client for the post load query (subject to change)
    doc_id: "8845758582119845",
  };
};

async function fetchGraphQL(shortcode: string) {
  const body = new URLSearchParams(encodeGraphqlRequestData(shortcode)).toString();
  const res = await fetch("https://www.instagram.com/api/graphql", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.status}`);
  return res.json() as Promise<{
    data?: { xdt_shortcode_media?: MediaData };
  }>;
}

/** ----------------------------------------------------------------
 * Normalizers (Page JSON & GraphQL JSON -> NormalizedMedia[])
 * ---------------------------------------------------------------*/
function normalizeFromPageJSON(json: any): NormalizedMedia[] {
  // Page JSON shapes vary (web vs. mweb). Handle the common structures.
  // Prefer graphql.shortcode_media if present.
  const sm =
    json?.graphql?.shortcode_media ??
    json?.items?.[0] ??
    json?.data?.xdt_shortcode_media;

  if (!sm) return [];

  // Carousel (sidecar)
  const sidecar =
    sm?.edge_sidecar_to_children?.edges ||
    sm?.carousel_media?.map((m: any) => ({ node: m })) ||
    [];

  if (Array.isArray(sidecar) && sidecar.length > 0) {
    const items: NormalizedMedia[] = [];
    for (const edge of sidecar) {
      const node = edge?.node || edge; // some shapes are flat
      if (!node) continue;

      // video?
      const videoUrl = node?.video_url || node?.video_versions?.[0]?.url;
      if (videoUrl) {
        items.push({
          kind: "video",
          url: videoUrl,
          width: node?.dimensions?.width || node?.original_width,
          height: node?.dimensions?.height || node?.original_height,
          filename: getIGVideoFileName(),
        });
        continue;
      }

      // image?
      const img =
        node?.display_url ||
        node?.display_resources?.slice(-1)?.[0]?.src ||
        node?.image_versions2?.candidates?.[0]?.url;
      if (img) {
        items.push({
          kind: "image",
          url: img,
          width: node?.dimensions?.width || node?.original_width,
          height: node?.dimensions?.height || node?.original_height,
          filename: getIGImageFileName(),
        });
      }
    }
    return items;
  }

  // Single video (reel / video post)
  const videoUrl = sm?.video_url || sm?.video_versions?.[0]?.url;
  if (videoUrl) {
    return [
      {
        kind: "video",
        url: videoUrl,
        width: sm?.dimensions?.width || sm?.original_width,
        height: sm?.dimensions?.height || sm?.original_height,
        filename: getIGVideoFileName(),
      },
    ];
  }

  // Single image
  const img =
    sm?.display_url ||
    sm?.display_resources?.slice(-1)?.[0]?.src ||
    sm?.image_versions2?.candidates?.[0]?.url;

  if (img) {
    return [
      {
        kind: "image",
        url: img,
        width: sm?.dimensions?.width || sm?.original_width,
        height: sm?.dimensions?.height || sm?.original_height,
        filename: getIGImageFileName(),
      },
    ];
  }

  return [];
}

function normalizeFromGraphQL(data: MediaData): NormalizedMedia[] {
  // GraphQL MediaData from your src/features/instagram/types.ts
  // It covers both single media and sidecars.
  const sidecar = data?.edge_sidecar_to_children?.edges || [];
  if (Array.isArray(sidecar) && sidecar.length > 0) {
    const items: NormalizedMedia[] = [];
    for (const edge of sidecar) {
      const node: any = edge?.node;
      if (!node) continue;
      if (node?.is_video && node?.video_url) {
        items.push({
          kind: "video",
          url: node.video_url,
          width: node?.dimensions?.width,
          height: node?.dimensions?.height,
          filename: getIGVideoFileName(),
        });
      } else {
        const img =
          node?.display_url ||
          node?.display_resources?.slice(-1)?.[0]?.src;
        if (img) {
          items.push({
            kind: "image",
            url: img,
            width: node?.dimensions?.width,
            height: node?.dimensions?.height,
            filename: getIGImageFileName(),
          });
        }
      }
    }
    return items;
  }

  if (data?.is_video && data?.video_url) {
    return [
      {
        kind: "video",
        url: data.video_url,
        width: data?.dimensions?.width,
        height: data?.dimensions?.height,
        filename: getIGVideoFileName(),
      },
    ];
  }

  const img =
    (data as any)?.display_url ||
    (data as any)?.display_resources?.slice(-1)?.[0]?.src;
  if (img) {
    return [
      {
        kind: "image",
        url: img,
        width: data?.dimensions?.width,
        height: data?.dimensions?.height,
        filename: getIGImageFileName(),
      },
    ];
  }

  return [];
}

/** ----------------------------------------------------------------
 * Public: fetch + normalize (Page JSON first, GraphQL as fallback)
 * ---------------------------------------------------------------*/
export async function fetchAndNormalizeInstagramMedia(
  postUrl: string
): Promise<NormalizedMedia[]> {
  const info = await parseInstagramUrl(postUrl);
  const path = getPathForInstagramInfo(info);

  // 1) Page JSON (fast path)
  try {
    const pageJson = await fetchPageJSON(path);
    const items = normalizeFromPageJSON(pageJson);
    if (items.length > 0) return items;
  } catch {
    // fall through to GraphQL
  }

  // 2) GraphQL fallback
  try {
    const gql = await fetchGraphQL(info.id);
    const media = gql?.data?.xdt_shortcode_media;
    if (media) {
      const items = normalizeFromGraphQL(media);
      if (items.length > 0) return items;
    }
  } catch {
    // ignore, fail below
  }

  // Nothing found
  return [];
}

/** ----------------------------------------------------------------
 * Legacy helpers kept for compatibility with existing imports
 * ---------------------------------------------------------------*/
export const formatGraphqlJson = (data: MediaData): VideoInfo => {
  // Legacy single-video shape (kept to avoid breaking other imports)
  // Prefer using fetchAndNormalizeInstagramMedia instead.
  const filename = getIGVideoFileName();
  const width = (data.dimensions?.width ?? 0).toString();
  const height = (data.dimensions?.height ?? 0).toString();
  const videoUrl = (data as any)?.video_url ?? "";
  return { filename, width, height, videoUrl };
};

export const formatPageJson = (json: any): VideoInfo => {
  const sm = json?.graphql?.shortcode_media;
  const filename = getIGVideoFileName();
  const width = (sm?.dimensions?.width ?? 0).toString();
  const height = (sm?.dimensions?.height ?? 0).toString();
  const videoUrl = sm?.video_url ?? "";
  return { filename, width, height, videoUrl };
};
