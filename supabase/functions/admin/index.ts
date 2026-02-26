import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Forbidden: not an admin");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "list-users") {
      const { data: profiles, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-plan") {
      const { userId, plan } = await req.json();
      if (!userId || !plan) throw new Error("Missing userId or plan");
      const { error } = await supabaseClient
        .from("profiles")
        .update({ plan })
        .eq("user_id", userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete-user") {
      const { userId } = await req.json();
      if (!userId) throw new Error("Missing userId");
      const { error } = await supabaseClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-user") {
      const { email, password, fullName, plan } = await req.json();
      if (!email || !password) throw new Error("Missing email or password");
      const { data: newUser, error } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || "" },
      });
      if (error) throw error;
      // Update plan if not free
      if (plan && plan !== "free" && newUser.user) {
        await supabaseClient
          .from("profiles")
          .update({ plan })
          .eq("user_id", newUser.user.id);
      }
      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analytics") {
      const { data: totalUsers } = await supabaseClient
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const { count: totalCaptures } = await supabaseClient
        .from("capture_jobs")
        .select("id", { count: "exact", head: true });

      const { data: planCounts } = await supabaseClient
        .from("profiles")
        .select("plan");

      const plans: Record<string, number> = { free: 0, pro: 0, agency: 0 };
      planCounts?.forEach((p: any) => {
        plans[p.plan] = (plans[p.plan] || 0) + 1;
      });

      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: recentSignups } = await supabaseClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Recent captures (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentCaptures } = await supabaseClient
        .from("capture_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      return new Response(JSON.stringify({
        totalUsers: planCounts?.length || 0,
        totalCaptures: totalCaptures || 0,
        planDistribution: plans,
        recentSignups: recentSignups || 0,
        recentCaptures: recentCaptures || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = msg.includes("Forbidden") ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
