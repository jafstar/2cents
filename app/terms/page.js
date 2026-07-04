'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function Terms() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  async function accept() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    await supabase.from('2c_terms_acceptance').upsert({ user_id: user.id, version: 'v1' });
    router.push('/');
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1>Before you sit down</h1>
        <p>
          2¢ is a small, invite-only experiment. Questions you ask here are sent to several
          AI providers to generate anonymized takes, shown to you, and then discarded —
          nothing about what you ask or the answers you get is stored anywhere.
          Don't put anything in here you wouldn't want to type into a search bar you don't fully trust.
          This is for fun and for real thinking, not a substitute for professional advice.
        </p>
        <label>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          I understand and accept these terms.
        </label>
        <button disabled={!checked} onClick={accept}>Continue</button>
      </div>
      <style jsx>{`
        .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
          background: radial-gradient(circle at 50% 20%, #1a1a2e, #0d0d16 70%); color:#e8e6df;
          font-family: Georgia, serif; padding: 20px; }
        .card { background:#14141f; border:1px solid #33334a; border-radius:16px; padding:36px; width:480px; }
        h1 { color:#d7c98a; }
        p { font-size:14px; line-height:1.6; color:#c8c6bf; }
        label { display:flex; gap:10px; align-items:center; font-size:13px; margin: 16px 0; }
        button { width:100%; padding:10px; border-radius:6px; border:none; background:#d7c98a; color:#14141f;
          font-weight:bold; cursor:pointer; }
        button:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>
    </div>
  );
}
