"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        const res = await axios.get("/api/me");
        if (mounted) setUsername(res.data.username);
      } catch {
        if (mounted) setUsername(null);
      }
    }
    fetchUser();
    const handler = () => fetchUser();
    window.addEventListener("auth:login", handler);
    return () => { mounted = false; window.removeEventListener("auth:login", handler); };
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/logout");
    window.dispatchEvent(new Event("auth:login")); // will clear header username
    router.replace("/login");
  };

  if (!username) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 text-white">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-600/35 to-indigo-600/10 blur-2xl" />
            <div className="relative text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <span className="text-sm font-semibold tracking-wide">RS</span>
              </div>
              <div className="text-sm font-semibold tracking-wide">RamanSoftware</div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Session Required</h2>
              <p className="mt-1 text-sm text-white/70">
                Please login to continue to your client ledger workspace.
              </p>
              <a
                href="/login"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 text-white shadow-sm shadow-black/20 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <span className="text-sm font-semibold tracking-wide">RS</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide sm:text-base">RamanSoftware</div>
            <div className="text-xs text-white/60">Client Ledger Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-sm text-white/70 sm:block">
            Welcome, <span className="font-semibold text-white">{username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
