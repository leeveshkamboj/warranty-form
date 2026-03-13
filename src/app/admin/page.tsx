"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-slate-800 hover:text-slate-900 text-sm mb-4 inline-block font-medium">
          ← Home
        </Link>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-slate-900">
          <div className="bg-slate-800 text-white px-6 py-5">
            <h1 className="text-xl font-bold">Admin login</h1>
            <p className="text-slate-200 text-sm mt-1">Sign in to view warranty registrations.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-white font-medium hover:bg-slate-700 disabled:opacity-50 transition"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
