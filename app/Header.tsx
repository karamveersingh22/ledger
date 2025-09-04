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
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900 bg-opacity-95"
        style={{ minHeight: "100vh" }}
      >
        <a
          href="/login"
          className="text-2xl font-bold text-white underline bg-amber-600 rounded-2xl px-6 py-4 hover:bg-amber-400 shadow-lg"
        >
          Please login to continue
        </a>
      </div>
    );
  }
  return (
    <header className="w-full text-amber-400 font-bold flex justify-between items-center px-4 py-2 bg-gray-800 border-b">
      <div>
        {`Welcome ${username}`}
      </div>
      <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
    </header>
  );
}

export default Header;
