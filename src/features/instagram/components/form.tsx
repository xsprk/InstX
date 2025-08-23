"use client";

import { useState } from "react";
import { fetchAndNormalizeInstagramMedia, MediaItem, isValidInstagramURL } from "../utils";

export default function InstagramVideoForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMedia([]);

    const errMsg = isValidInstagramURL(url);
    if (errMsg) {
      setError(errMsg);
      setLoading(false);
      return;
    }

    try {
      const result = await fetchAndNormalizeInstagramMedia(url);
      setMedia(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow rounded-xl">
      <h1 className="text-2xl font-bold mb-4 text-center">Instagram Downloader</h1>
      <form onSubmit={handleFetch} className="flex gap-2">
        <input
          type="text"
          placeholder="Paste Instagram link..."
          className="flex-1 border rounded-lg px-3 py-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {media.length > 0 && (
        <div className="mt-6 space-y-6">
          {media.map((item, index) => (
            <div
              key={index}
              className="border p-3 rounded-lg shadow-sm flex flex-col items-center"
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Instagram media ${index + 1}`}
                  className="w-full rounded-lg"
                />
              ) : (
                <video
                  controls
                  src={item.url}
                  className="w-full rounded-lg"
                />
              )}
              <a
                href={item.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Download {item.type === "image" ? "Image" : "Video"} {media.length > 1 ? `(${index + 1})` : ""}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
