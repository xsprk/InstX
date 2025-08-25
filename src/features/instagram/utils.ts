// utils.ts
import axios from "axios";

export type MediaItem = { url: string; type: "video" | "image" };

// 🔁 New implementation: use our unified server route
export async function fetchInstagramMedia(instaUrl: string): Promise<MediaItem[]> {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: instaUrl }),
  });

  if (!res.ok) throw new Error("Failed to fetch media");

  const data = await res.json();
  const files = Array.isArray(data?.files) ? data.files : [];

  // Map to the shape your UI already renders
  return files.map((f: any) => ({
    url: f.url,
    type: f.media_type === "video" ? "video" : "image",
  }));
}

    const media: MediaItem[] = [];
    const mediaObj = data?.data?.shortcode_media;
    if (!mediaObj) throw new Error("Could not fetch post data");

    if (mediaObj.edge_sidecar_to_children) {
      mediaObj.edge_sidecar_to_children.edges.forEach((edge: any) => {
        media.push({
          url: edge.node.is_video ? edge.node.video_url : edge.node.display_url,
          type: edge.node.is_video ? "video" : "image",
        });
      });
    } else {
      media.push({
        url: mediaObj.is_video ? mediaObj.video_url : mediaObj.display_url,
        type: mediaObj.is_video ? "video" : "image",
      });
    }

    return media;
  } catch (error: any) {
    console.error("fetchInstagramMedia error:", error.message);
    throw new Error("Failed to fetch media");
  }
}
