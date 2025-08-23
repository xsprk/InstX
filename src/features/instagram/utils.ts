import axios from "axios";

export type MediaItem = {
  url: string;
  type: "video" | "image";
};

export async function fetchInstagramMedia(instaUrl: string): Promise<MediaItem[]> {
  try {
    // extract shortcode from URL
    const match = instaUrl.match(/\/(p|reel|tv)\/([^/?]+)/);
    if (!match) throw new Error("Invalid Instagram URL");
    const shortcode = match[2];

    // Instagram internal GraphQL endpoint
    const jsonUrl = `https://www.instagram.com/graphql/query/?query_hash=2c4c2e343a8f64c625ba02b2aa12c7f9&variables={"shortcode":"${shortcode}","child_comment_count":3,"fetch_comment_count":40,"parent_comment_count":24,"has_threaded_comments":true}`;

    const { data } = await axios.get(jsonUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const media: MediaItem[] = [];
    const mediaObj = data?.data?.shortcode_media;

    if (!mediaObj) throw new Error("Could not fetch post data");

    // Carousel (multiple images/videos)
    if (mediaObj.edge_sidecar_to_children) {
      mediaObj.edge_sidecar_to_children.edges.forEach((edge: any) => {
        if (edge.node.is_video) {
          media.push({
            url: edge.node.video_url,
            type: "video",
          });
        } else {
          media.push({
            url: edge.node.display_url,
            type: "image",
          });
        }
      });
    } else {
      // Single image or reel
      if (mediaObj.is_video) {
        media.push({
          url: mediaObj.video_url,
          type: "video",
        });
      } else {
        media.push({
          url: mediaObj.display_url,
          type: "image",
        });
      }
    }

    return media;
  } catch (error: any) {
    console.error("fetchInstagramMedia error:", error.message);
    throw new Error("Failed to fetch media");
  }
}
