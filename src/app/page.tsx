"use client";

import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type UrlItem = {
  id: number;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  lastClicked?: string | null;
  createdAt: string;
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  async function fetchUrls() {
    try {
      const res = await fetch("/api/links");
      if (!res.ok) {
        const txt = await res.text().catch(() => "<body-read-error>");
        console.error("[fetchUrls] HTTP error", res.status, txt);
        setUrls([]);
        return;
      }
      const data = await res.json();
      setUrls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[fetchUrls] network error:", err);
      setUrls([]);
    }
  }

  useEffect(() => {
    fetchUrls();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!url.trim()) {
      setError("Please enter a URL");
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, code: code || undefined }),
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        const msg = data?.error || "Failed to shorten";
        setError(msg);
        toast.error(msg);
      } else {
        setUrls((prev) => [data as UrlItem, ...prev]);
        setUrl("");
        setCode("");
        toast.success("Short link created");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteByCode(shortCode: string) {
    if (!confirm("Delete this link? This action cannot be undone.")) return;

    const prev = urls;
    setUrls((u) => u.filter((x) => x.shortCode !== shortCode));
    toast("Deleted");

    try {
      const res = await fetch(`/api/links/${encodeURIComponent(shortCode)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setUrls(prev);
        const msg = data?.error || "Delete failed";
        toast.error(msg);
      } else {
        toast.success("Delete confirmed");
      }
    } catch (err) {
      console.error(err);
      setUrls(prev);
      toast.error("Delete failed");
    }
  }

  const filtered = urls.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return u.shortCode.toLowerCase().includes(q) || u.originalUrl.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 40 }}
      />

      <main className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mini URL Shortener</h1>
          <p className="text-gray-600 mb-6">Shorten URLs, add custom codes, and manage links.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/link"
              className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Custom code (optional)"
              className="w-48 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 text-white font-semibold px-4 py-2 disabled:opacity-60 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {loading ? "Creating..." : "Shorten"}
            </button>
          </div>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </form>

        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or URL"
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <button
              onClick={() => {
                setQuery("");
                fetchUrls();
              }}
              className="ml-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Refresh
            </button>
          </div>
        </div>

        <section className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your links</h2>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No links found — create one above.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-200 text-left text-sm table-auto">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 max-w-[500px]">Short</th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 max-w-[250px]">Original</th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 w-16">Clicks</th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 w-40">Last clicked</th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 w-40">Created</th>
                  <th className="py-3 px-4 border-b border-gray-300 font-semibold text-indigo-700 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-100 transition`}
                  >
                    <td className="py-3 px-4 max-w-[500px] truncate">
                      <a
                        href={`/${u.shortCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-medium"
                        title={`${origin}/${u.shortCode}`}
                      >
                        {origin}/{u.shortCode}
                      </a>
                      <div className="text-xs text-gray-500 mt-1 truncate">{u.shortCode}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[250px] truncate" title={u.originalUrl}>
                      <a
                        href={u.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline break-words"
                      >
                        {u.originalUrl}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">{u.clicks}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      {u.lastClicked ? new Date(u.lastClicked).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-center">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={`/code/${u.shortCode}`}
                          className="rounded-md border border-indigo-600 text-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-100 transition"
                        >
                          Stats
                        </a>
                        <button
                          onClick={() => handleDeleteByCode(u.shortCode)}
                          className="rounded-md bg-red-600 text-white px-3 py-1 text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        
      </main>
    </div>
  );
}
