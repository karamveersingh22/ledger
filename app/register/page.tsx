// "use client";
// import { useState } from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";

// export default function RegisterPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("client");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const router = useRouter();

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     try {
//   const res = await axios.post("/api/auth/register", { username, password, role });
//       setSuccess("Registration successful! You can now login.");
//       setTimeout(() => router.push("/login"), 1500);
//     } catch (err: any) {
//       setError(err.response?.data?.error || "Registration failed");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h2 className="text-2xl mb-4">Register</h2>
//       <form onSubmit={handleRegister} className="flex flex-col gap-2 w-80">
//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={e => setUsername(e.target.value)}
//           className="border p-2"
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//           className="border p-2"
//           required
//         />
//         <select
//           value={role}
//           onChange={e => setRole(e.target.value)}
//           className="border p-2"
//         >
//           <option value="client">Client</option>
//           <option value="admin">Admin</option>
//         </select>
//         <button type="submit" className="bg-green-500 text-white p-2 rounded">Register</button>
//         {error && <p className="text-red-500">{error}</p>}
//         {success && <p className="text-green-500">{success}</p>}
//       </form>
//       <p className="mt-4">
//         Already have an account? <a href="/login" className="text-blue-600 underline">Login</a>
//       </p>
//     </div>
//   );
// }