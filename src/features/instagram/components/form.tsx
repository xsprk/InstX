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
    <div className="max-w-lg mx-auto mt-10 p-4 bg-white shadow rounded-lg">
      <h1 className="text-xl font-bold text-center mb-3">Instagram Downloader</h1>
      <form onSubmit={handleFetch} className="flex gap-2">
        <input
          type="text"
          placeholder="Paste Instagram link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {media.length > 0 && (
        <div className="mt-4 space-y-4">
          {media.map((item, i) => (
            <div key={i} className="border p-2 rounded flex flex-col items-center">
              {item.type === "image" ? (
                <img src={item.url} className="w-full rounded" />
              ) : (
                <video src={item.url} controls className="w-full rounded" />
              )}
              <a
                href={item.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
              >
                Download {item.type} {media.length > 1 ? `(${i + 1})` : ""}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
