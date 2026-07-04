'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function sendLink(e) {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1>2¢</h1>
        <p className="sub">Invite only. If you've got a golden ticket, you already know that.</p>
        {sent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={sendLink}>
            <input type="email" required placeholder="your email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <button type="submit">Send sign-in link</button>
          </form>
        )}
        {error && <p className="err">{error}</p>}
      </div>
      <style jsx>{`
        .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
          background: radial-gradient(circle at 50% 20%, #1a1a2e, #0d0d16 70%); color:#e8e6df;
          font-family: Georgia, serif; }
        .card { background:#14141f; border:1px solid #33334a; border-radius:16px; padding:36px; width:360px; text-align:center; }
        h1 { color:#d7c98a; font-size:40px; margin:0; }
        .sub { color:#8a889e; font-size:13px; margin-bottom:20px; }
        input { width:100%; padding:10px; margin-bottom:12px; border-radius:6px; border:1px solid #33334a; background:#1c1c2b; color:#e8e6df; }
        button { width:100%; padding:10px; border-radius:6px; border:none; background:#d7c98a; color:#14141f; font-weight:bold; cursor:pointer; }
        .err { color:#e08a8a; font-size:13px; margin-top:10px; }
      `}</style>
    </div>
  );
}
