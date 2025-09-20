"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/login", { username, password, role });
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-2 w-80">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2"
          required
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? 'Authenticating...' : 'Login'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
