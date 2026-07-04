import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import RoundTable from './RoundTable';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: allowed } = await supabase.rpc('2c_user_is_allowed', { check_user_id: user.id });

  if (!allowed) {
    const { data: termsRow } = await supabase.from('2c_terms_acceptance').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!termsRow) redirect('/terms');
    // signed in, terms accepted, but no redeemed invite — a real "not on the list" state
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d0d16', color: '#8a889e', fontFamily: 'Georgia, serif' }}>
        You're signed in, but there's no golden ticket on this account yet. Ask whoever invited you.
      </div>
    );
  }

  return <RoundTable />;
}
