"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";

function ManagePage() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch client users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/manage");
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add new client user (users.json)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/api/manage", { username, password, role: "client" });
      setMessage(res.data.message);
      setUsername("");
      setPassword("");
      fetchUsers();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Error adding user");
    }
  };

  // Delete client user (users.json)
  const handleDeleteUser = async (username: string) => {
    setMessage("");
    try {
      await axios.delete("/api/manage", { data: { username } });
      setMessage("User deleted successfully.");
      fetchUsers();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Error deleting user");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Manage Users</h2>
      <form onSubmit={handleAddUser} className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Add Client User</button>
      </form>
      {message && <div className="mb-4 text-red-600">{message}</div>}
      <h3 className="text-lg font-semibold mb-2">Client Users</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {users.length === 0 ? (
            <li>No client users found.</li>
          ) : (
            users.map((user: any) => (
              <li key={user._id} className="flex justify-between items-center border p-2 rounded">
                <span>{user.username}</span>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDeleteUser(user.username)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default ManagePage;