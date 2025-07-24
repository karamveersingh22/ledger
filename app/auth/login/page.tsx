"use client";
import axios from 'axios';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const login = async () => {
    try {
      const res = await axios.post('/api/auth/login', {
        phone,
        password,
      });

      if (res.data.success) {
        alert("Logged in successfully.");
        // You can now navigate or fetch protected data
        router.push('/');
      } else {
        alert(res.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check credentials.");
    }
  };

  return (
    <div className='p-4 space-y-2'>
      <input
        type='text'
        placeholder='Phone'
        className='border p-2'
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type='password'
        placeholder='Password'
        className='border p-2'
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className='bg-blue-600 text-white p-2 m-2' onClick={login}>Login</button>
      <button className='bg-blue-600 text-white p-2 m-2'>Forget password</button>
      <div>
        <Link href="/auth/reset" className="text-white underline bg-blue-600">Reset your password?</Link>
      </div>
      <div>
        <p>if not registered :</p>
        <Link className="text-white underline bg-blue-600" href={"/auth/register"}>Register Here</Link>
      </div>
    </div>
  );
}

export default LoginPage;
