import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { runRoundTable } from '../../../lib/shared';

// No storage in this route — the question comes in, the request body is
// never written to disk or a database, and the response is generated fresh
// per-call. Auth + terms gate is checked server-side on every request, not
// just once at login, so a revoked invite takes effect immediately.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

  const { data: allowed } = await supabase.rpc('2c_user_is_allowed', { check_user_id: user.id });
  if (!allowed) return NextResponse.json({ error: 'not authorized — invite or terms acceptance missing' }, { status: 403 });

  const { question } = await request.json();
  if (!question || typeof question !== 'string' || question.length > 2000) {
    return NextResponse.json({ error: 'invalid question' }, { status: 400 });
  }

  const seats = await runRoundTable(question);
  return NextResponse.json({ seats });
}
