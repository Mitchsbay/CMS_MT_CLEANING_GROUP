import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const anonKey = getEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Authorization header required' }, 401);

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return jsonResponse({ error: 'Bearer token required' }, 401);

    // Caller-scoped client (AUTHENTICATED via provided JWT)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Validate the JWT with Supabase Auth (since verify_jwt may be disabled at the gateway)
    const { data: userData, error: userError } = await callerClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Invalid or expired session token' }, 401);
    }

    // Verify caller's admin role via RPC (server-authoritative)
    const { data: isAdmin, error: rpcError } = await callerClient.rpc('is_admin');
    if (rpcError || !isAdmin) {
      return jsonResponse({ error: 'Unauthorized: Admin access required' }, 403);
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: 'JSON body required' }, 400);
    }

    const userIdToDelete = payload?.userId || payload?.user_id;
    if (!userIdToDelete) {
      return jsonResponse({ error: 'userId or user_id is required' }, 400);
    }

    // Admin (service role) client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Optional: mark profile inactive before deleting auth user (best-effort)
    await supabaseAdmin.from('profiles').update({ status: 'inactive' }).eq('id', userIdToDelete);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    if (authError) return jsonResponse({ error: authError.message }, 400);

    return jsonResponse(
      {
        success: true,
        message: 'User deleted successfully',
      },
      200
    );
  } catch (error: any) {
    return jsonResponse({ error: error?.message ?? 'Unknown error' }, 500);
  }
});
