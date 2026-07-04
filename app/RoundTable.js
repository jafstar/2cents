'use client';
import { useState } from 'react';

export default function RoundTable() {
  const [question, setQuestion] = useState('');
  const [seats, setSeats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ask(e) {
    e.preventDefault();
    setLoading(true); setError(''); setSeats(null);
    try {
      const res = await fetch('/api/roundtable', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'something went wrong');
      setSeats(data.seats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="table">
        <h1>2¢ ROUND TABLE</h1>
        <p className="sub">Ask a real question. Get anonymized takes, dealt like cards, no names attached.</p>
        <form onSubmit={ask}>
          <textarea required rows={3} placeholder="What's the actual situation?"
            value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button type="submit" disabled={loading}>{loading ? 'Dealing...' : 'Deal the table'}</button>
        </form>
        {error && <p className="err">{error}</p>}
        {seats && (
          <div className="seats">
            {seats.map((s, i) => (
              <div className="seat" key={i}>
                <span className="card">{s.card}</span>
                <span className="persona">{s.persona}</span>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
          background: radial-gradient(circle at 50% 20%, #1a1a2e, #0d0d16 70%);
          font-family: Georgia, serif; color:#e8e6df; padding:30px; }
        .table { width:900px; max-width:94vw; padding:36px 40px; border-radius:16px;
          background:#14141f; border:1px solid #33334a; }
        h1 { text-align:center; color:#d7c98a; letter-spacing:1px; margin-bottom:4px; }
        .sub { text-align:center; color:#8a889e; font-size:13px; margin-bottom:20px; }
        textarea { width:100%; padding:12px; border-radius:8px; border:1px solid #33334a;
          background:#1c1c2b; color:#e8e6df; font-family:inherit; font-size:14px; resize:vertical; }
        button { margin-top:12px; padding:10px 22px; border-radius:6px; border:none;
          background:#d7c98a; color:#14141f; font-weight:bold; cursor:pointer; }
        button:disabled { opacity:0.5; cursor:wait; }
        .err { color:#e08a8a; margin-top:10px; }
        .seats { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:24px; }
        .seat { background:#1c1c2b; border:1px solid #33334a; border-radius:10px; padding:16px; }
        .card { font-size:20px; color:#d7c98a; margin-right:10px; }
        .persona { font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#8a889e; }
        p { font-size:14px; line-height:1.5; margin-top:10px; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
