// src/features/instagram/utils.ts

export type MediaItem = { url: string; type: "video" | "image" };

// 🔁 New implementation: use our unified server route
export async function fetchInstagramMedia(instaUrl: string): Promise<MediaItem[]> {
  try {
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: instaUrl }),
    });

    if (!res.ok) throw new Error("Failed to fetch media");

    const data = await res.json();
    const files = Array.isArray(data?.files) ? data.files : [];

    // Map to the shape your UI already expects
    return files.map((f: any) => ({
      url: f.url,
      type: f.media_type === "video" ? "video" : "image",
    }));
  } catch (error: any) {
    console.error("fetchInstagramMedia error:", error.message);
    throw new Error("Failed to fetch media");
  }
}
