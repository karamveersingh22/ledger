"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/login", { username, password });
      console.log(res.data);
      // Dispatch event so header can refresh username
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:login'));
      }
      // Redirect based on role - middleware will handle further redirects if needed
      const serverRole = res.data.role;
      if (serverRole === 'admin') {
        router.replace('/manage');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    } 
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 shadow-sm shadow-black/20 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
              <span className="text-sm font-semibold tracking-wide">RS</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide sm:text-base">RamanSoftware</div>
            </div>
          </div>
          <div className="text-xs font-medium text-white/70 sm:text-sm">Client Ledger Portal</div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-600/40 to-indigo-600/10 blur-2xl" />

            <div className="relative p-6 sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
                <p className="mt-1 text-sm text-white/70">
                  Login to access your client ledger reports securely
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1 block text-xs font-medium text-white/70">
                    Username
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/15"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-xs font-medium text-white/70">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M6.75 10.5h10.5a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/15"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
                  </span>
                  <span className="relative">
                    {loading ? "Authenticating..." : "Login"}
                  </span>
                </button>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-center text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-6">
          <div>
            <span className="font-medium text-white/80">Help Desk:</span> +91-9316910052
          </div>
          <div>For login issues, contact RamanSoftware support team</div>
        </div>
      </footer>
    </div>
  );
}
