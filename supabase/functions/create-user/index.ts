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

const allowedRoles = new Set(['admin', 'staff', 'client']);
const allowedStatuses = new Set(['active', 'inactive']);

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

    const { email, password, full_name, phone, role, status } = payload ?? {};
    if (!email || !password || !full_name) {
      return jsonResponse({ error: 'Email, password, and full_name are required' }, 400);
    }

    const desiredRole = role ?? 'staff';
    const desiredStatus = status ?? 'active';

    if (!allowedRoles.has(desiredRole)) {
      return jsonResponse({ error: `Invalid role: ${desiredRole}` }, 400);
    }
    if (!allowedStatuses.has(desiredStatus)) {
      return jsonResponse({ error: `Invalid status: ${desiredStatus}` }, 400);
    }

    // Admin (service role) client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create auth user. IMPORTANT: Do NOT store role/status in user_metadata.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });

    if (authError) return jsonResponse({ error: authError.message }, 400);
    const userId = authData?.user?.id;
    if (!userId) return jsonResponse({ error: 'User created but missing user id' }, 500);

    // Upsert authoritative profile role/status (server-side only)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name,
          phone: phone ?? null,
          role: desiredRole,
          status: desiredStatus,
        },
        { onConflict: 'id' }
      );

    if (profileError) return jsonResponse({ error: profileError.message }, 400);

    return jsonResponse(
      {
        success: true,
        user: authData.user,
        message: 'User created successfully',
      },
      200
    );
  } catch (error: any) {
    return jsonResponse({ error: error?.message ?? 'Unknown error' }, 500);
  }
});
