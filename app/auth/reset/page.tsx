"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function ResetPasswordPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();

  const requestCode = async () => {
    try {
      const res = await axios.post('/api/auth/reset/request', { phone });
      if (res.data.success) {
        alert('Reset code sent!');
        setCodeSent(true);
      } else {
        alert(res.data.message || 'Failed to send code');
      }
    } catch (error) {
      alert('Failed to send code');
    }
  };

  const resetPassword = async () => {
    try {
      const res = await axios.post('/api/auth/reset/confirm', { phone, code, newPassword });
      if (res.data.success) {
        alert('Password reset successful!');
        router.push('/auth/login');
      } else {
        alert(res.data.message || 'Failed to reset password');
      }
    } catch (error) {
      alert('Failed to reset password');
    }
  };

  return (
    <div className='p-4 space-y-2'>
      <input
        type='text'
        placeholder='Phone'
        className='border p-2'
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button className='bg-blue-600 text-white p-2' onClick={requestCode}>Send code</button>
      {codeSent && (
        <>
          <input
            type='text'
            placeholder='Reset code'
            className='border p-2'
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <input
            type='password'
            placeholder='New password'
            className='border p-2'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button className='bg-green-600 text-white p-2' onClick={resetPassword}>Reset Password</button>
        </>
      )}
    </div>
  );
}

export default ResetPasswordPage; 