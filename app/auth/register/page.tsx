"use client";
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import useRouter from 'next/navigation';
import Link from 'next/link';

const registerPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('/api/auth/register', {
        phone,
        password,
      });
      console.log(response.data);
      setMessage("user registered successfully")

      // const token = response.data.token;

      // // ✅ Save token in cookies
      // Cookies.set('token', token, {
      //   expires: 7,           // Token expires in 7 days
      //   secure: true,         // Only works over HTTPS
      //   sameSite: 'Strict',   // Prevent CSRF
      // });

      // setMessage("User registered and token saved to cookies");
    } catch (error: any) {
      console.error("Signup failed", error);
      setMessage("Signup failed");
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold">Register</h2>

      <input
        type="text"
        placeholder="Phone number"
        className="w-full p-2 border rounded"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleRegister}
        className="w-full bg-blue-500 text-white py-2 rounded"
      >
        Sign Up
      </button>

      {/* {message && <p className="text-sm text-gray-700">{message}</p>} */}
      {message.length > 0 ? (
        <>
        <p>{message}</p><Link href="/auth/login">Login here</Link>
        </>
      ) : (
        <p>You are being registered please wait...</p>
      ) }
    </div>
  );
};

export default registerPage;
