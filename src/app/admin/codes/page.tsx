"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CodeRow {
  _id: string;
  code: string;
  used: boolean;
  usedAt?: string;
  registrationId?: string;
  createdAt: string;
}

interface RegistrationDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  brandName?: string;
  productName?: string;
  dateOfPurchase: string;
  placeOfPurchase: string;
  warrantyRegistrationCode: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function AdminCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addResult, setAddResult] = useState<{ added: number; skipped: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [manualCodes, setManualCodes] = useState("");
  const [bulkPaste, setBulkPaste] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [markUnusedId, setMarkUnusedId] = useState<string | null>(null);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [viewUsedRegistrationId, setViewUsedRegistrationId] = useState<string | null>(null);
  const [registrationDetail, setRegistrationDetail] = useState<RegistrationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCodes = useCallback(
    (pageNum: number, search: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      if (filter === "used") params.set("used", "true");
      if (filter === "unused") params.set("used", "false");
      if (search.trim()) params.set("search", search.trim());
      fetch(`/api/admin/codes?${params}`, { credentials: "include" })
        .then((res) => {
          if (res.status === 401) {
            router.replace("/admin");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && !data.error) {
            setCodes(data.data ?? []);
            setTotal(data.total ?? 0);
            setPage(data.page ?? 1);
            setTotalPages(data.totalPages ?? 1);
          } else if (data?.error) setError(data.error);
        })
        .catch(() => setError("Failed to load codes"))
        .finally(() => setLoading(false));
    },
    [router, filter]
  );

  useEffect(() => {
    loadCodes(page, searchQuery);
  }, [page, searchQuery, loadCodes]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin");
    router.refresh();
  };

  const addFromPaste = async () => {
    if (!bulkPaste.trim()) return;
    setAdding(true);
    setError("");
    setAddResult(null);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paste: bulkPaste }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setAddResult({ added: data.added, skipped: data.skipped ?? 0 });
      setBulkPaste("");
      loadCodes(1, searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add codes");
    } finally {
      setAdding(false);
    }
  };

  const addFromFile = async () => {
    if (!file) return;
    setAdding(true);
    setError("");
    setAddResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setAddResult({ added: data.added, skipped: data.skipped ?? 0 });
      setFile(null);
      loadCodes(1, searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add codes");
    } finally {
      setAdding(false);
    }
  };

  const addManual = async () => {
    const lines = manualCodes.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const codeList = lines.map((s) => s.replace(/\D/g, "")).filter((s) => s.length === 8);
    if (codeList.length === 0) {
      setError("Enter one or more 8-digit codes (one per line or space-separated).");
      return;
    }
    setAdding(true);
    setError("");
    setAddResult(null);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: codeList }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setAddResult({ added: data.added, skipped: data.skipped ?? 0 });
      setManualCodes("");
      loadCodes(1, searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add codes");
    } finally {
      setAdding(false);
    }
  };

  const openViewUsed = (registrationId: string) => {
    setViewUsedRegistrationId(registrationId);
    setRegistrationDetail(null);
    setLoadingDetail(true);
    fetch(`/api/admin/registrations/${registrationId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setRegistrationDetail(data ?? null);
      })
      .catch(() => setRegistrationDetail(null))
      .finally(() => setLoadingDetail(false));
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const handleMarkUnused = async () => {
    if (!markUnusedId) return;
    setActioning(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/codes/${markUnusedId}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark unused");
      }
      setMarkUnusedId(null);
      loadCodes(page, searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark unused");
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!deleteCodeId) return;
    setActioning(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/codes/${deleteCodeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setDeleteCodeId(null);
      loadCodes(page, searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete code");
    } finally {
      setActioning(false);
    }
  };

  if (loading && codes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-800">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 text-slate-900">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/admin/dashboard" className="text-slate-800 hover:text-slate-900 text-sm font-medium py-2">
                ← Registrations
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage codes</h1>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px] w-fit"
            >
              Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {addResult && (
          <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-4 text-sm">
            Added {addResult.added} code(s). {addResult.skipped > 0 ? `Skipped ${addResult.skipped} (already exist).` : ""}
          </div>
        )}

        {/* Add codes */}
        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Add codes</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Bulk add from .txt file</label>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block text-sm text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2.5 file:text-white file:text-sm w-full sm:w-auto"
                />
                <button
                  type="button"
                  onClick={addFromFile}
                  disabled={!file || adding}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 min-h-[44px]"
                >
                  Upload and add
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">One 8-digit code per line. Other lines are ignored.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Bulk add (paste)</label>
              <textarea
                value={bulkPaste}
                onChange={(e) => setBulkPaste(e.target.value)}
                placeholder="Paste codes here, one per line"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
              <button
                type="button"
                onClick={addFromPaste}
                disabled={!bulkPaste.trim() || adding}
                className="mt-2 rounded-xl bg-slate-800 px-4 py-2.5 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
              >
                Add from paste
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Add manually</label>
              <textarea
                value={manualCodes}
                onChange={(e) => setManualCodes(e.target.value)}
                placeholder="Enter one or more 8-digit codes (one per line)"
                rows={2}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
              <button
                type="button"
                onClick={addManual}
                disabled={!manualCodes.trim() || adding}
                className="mt-2 rounded-xl bg-slate-800 px-4 py-2.5 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
              >
                Add codes
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Codes</h2>
            <div className="flex gap-2 flex-wrap">
              {(["all", "unused", "used"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium min-h-[44px] ${
                    filter === f ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {f === "all" ? "All" : f === "unused" ? "Unused" : "Used"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="search"
                placeholder="Search by code…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              />
            </div>
            {searchQuery && (
              <span className="text-slate-600 text-sm">
                {total} result{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            {codes.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-700 text-sm sm:text-base">
                {searchQuery ? "No codes match your search." : "No codes found."}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[280px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Used at</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-900">
                      <td className="py-3 px-4 font-mono text-slate-800">{r.code}</td>
                      <td className="py-3 px-4">
                        <span className={r.used ? "text-amber-700" : "text-green-700"}>
                          {r.used ? "Used" : "Unused"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {r.usedAt ? formatDate(r.usedAt) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          {r.used && r.registrationId && (
                            <button
                              type="button"
                              onClick={() => openViewUsed(r.registrationId!)}
                              className="text-slate-700 hover:text-slate-900 underline text-xs font-medium py-1 px-0.5 min-h-0 min-w-0"
                            >
                              Details
                            </button>
                          )}
                          {r.used && (
                            <button
                              type="button"
                              onClick={() => setMarkUnusedId(r._id)}
                              className="text-slate-700 hover:text-slate-900 underline text-xs font-medium py-1 px-0.5 min-h-0 min-w-0"
                            >
                              Mark unused
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteCodeId(r._id)}
                            className="text-red-600 hover:text-red-800 underline text-xs font-medium py-1 px-0.5 min-h-0 min-w-0"
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
          </div>
          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
                {total > 0 && (
                  <span className="ml-1">
                    ({((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total})
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark unused confirmation */}
      {markUnusedId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Mark code as unused</h2>
            <p className="text-slate-700 text-sm mb-6">
              This code will become available for a new registration. The existing registration record will not be deleted. Continue?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMarkUnusedId(null)}
                disabled={actioning}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkUnused}
                disabled={actioning}
                className="rounded-xl bg-slate-800 px-4 py-3 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 min-h-[44px]"
              >
                {actioning ? "Updating…" : "Mark unused"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete code confirmation */}
      {deleteCodeId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete code</h2>
            <p className="text-slate-700 text-sm mb-6">
              This code will be permanently removed. It cannot be used for registration anymore. Are you sure?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteCodeId(null)}
                disabled={actioning}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCode}
                disabled={actioning}
                className="rounded-xl bg-red-600 px-4 py-3 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
              >
                {actioning ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View who used – registration detail modal */}
      {viewUsedRegistrationId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Registration (who used this code)</h2>
              <button
                type="button"
                onClick={() => { setViewUsedRegistrationId(null); setRegistrationDetail(null); }}
                className="rounded-lg p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {loadingDetail ? (
                <p className="text-slate-600 text-sm">Loading…</p>
              ) : registrationDetail ? (
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500 font-medium">Name</dt>
                    <dd className="text-slate-900">{registrationDetail.firstName} {registrationDetail.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Email</dt>
                    <dd className="text-slate-900 break-all">{registrationDetail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Phone</dt>
                    <dd className="text-slate-900">{registrationDetail.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Brand</dt>
                    <dd className="text-slate-900">{registrationDetail.brandName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Product</dt>
                    <dd className="text-slate-900">{registrationDetail.productName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Shop name</dt>
                    <dd className="text-slate-900">{registrationDetail.placeOfPurchase}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Date of purchase</dt>
                    <dd className="text-slate-900">{registrationDetail.dateOfPurchase}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Registered at</dt>
                    <dd className="text-slate-900">{registrationDetail.createdAt ? formatDate(registrationDetail.createdAt) : "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-slate-600 text-sm">Could not load registration details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
