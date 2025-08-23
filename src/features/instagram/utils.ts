// features/instagram/utils.ts
import axios from "axios";

export type MediaItem = { url: string; type: "video" | "image" };

export function isValidInstagramURL(url: string): string | null {
  if (!url.match(/instagram\.com\/(p|reel|tv)\//)) return "Invalid Instagram URL";
  return null;
}

export async function fetchAndNormalizeInstagramMedia(instaUrl: string): Promise<MediaItem[]> {
  try {
    const match = instaUrl.match(/\/(p|reel|tv)\/([^/?]+)/);
    if (!match) throw new Error("Invalid Instagram URL");
    const shortcode = match[2];

    const jsonUrl = `https://www.instagram.com/graphql/query/?query_hash=2c4c2e343a8f64c625ba02b2aa12c7f9&variables={"shortcode":"${shortcode}","child_comment_count":3,"fetch_comment_count":40,"parent_comment_count":24,"has_threaded_comments":true}`;

    const { data } = await axios.get(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Mobile; InstagramDownloader)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const media: MediaItem[] = [];
    const mediaObj = data?.data?.shortcode_media;
    if (!mediaObj) throw new Error("No media found");

    if (mediaObj.edge_sidecar_to_children) {
      mediaObj.edge_sidecar_to_children.edges.forEach((edge: any) => {
        media.push(edge.node.is_video ? { url: edge.node.video_url, type: "video" } : { url: edge.node.display_url, type: "image" });
      });
    } else {
      media.push(mediaObj.is_video ? { url: mediaObj.video_url, type: "video" } : { url: mediaObj.display_url, type: "image" });
    }

    return media;
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch Instagram media");
  }
}
