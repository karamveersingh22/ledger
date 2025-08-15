"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get("/api/me");
        setUsername(res.data.username);
      } catch {
        setUsername(null);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await axios.post("/api/logout");
    router.replace("/login");
  };

  return (
    <header className="w-full text-amber-400 font-bold flex justify-between items-center px-4 py-2 bg-gray-800 border-b">
      <div>
        {username ? `Welcome ${username}` : ""}
      </div>
      <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
    </header>
  );
}

export default Header;
