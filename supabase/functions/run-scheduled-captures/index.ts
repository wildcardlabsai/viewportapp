import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch active schedules whose next_run_at has passed
    const { data: schedules, error: fetchError } = await supabase
      .from("scheduled_captures")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", new Date().toISOString())
      .limit(20);

    if (fetchError) throw fetchError;
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ message: "No schedules to run", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const schedule of schedules) {
      try {
        const options = schedule.capture_options || {};

        // Create a capture job
        const { data: job, error: insertError } = await supabase
          .from("capture_jobs")
          .insert({
            user_id: schedule.user_id,
            url: schedule.url,
            device_preset: schedule.device_preset,
            viewport_width: schedule.viewport_width,
            viewport_height: schedule.viewport_height,
            device_scale_factor: options.device_scale_factor || 1,
            full_page: options.full_page || false,
            delay_seconds: options.delay_seconds || 0,
            output_format: options.output_format || "png",
            background: options.background || "white",
            hide_cookie_banners: options.hide_cookie_banners || false,
            hide_chat_widgets: options.hide_chat_widgets || false,
            hide_sticky_headers: options.hide_sticky_headers || false,
            hide_popups: options.hide_popups || false,
            project_id: schedule.project_id,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        // Calculate next run based on cron expression (simplified)
        const nextRun = calculateNextRun(schedule.cron_expression);

        // Update schedule
        await supabase
          .from("scheduled_captures")
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRun.toISOString(),
          })
          .eq("id", schedule.id);

        // Invoke process-captures to actually take the screenshot
        await supabase.functions.invoke("process-captures", {
          body: { job_ids: [job.id] },
        });

        results.push({ schedule_id: schedule.id, job_id: job.id, status: "triggered" });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Schedule ${schedule.id} failed:`, errMsg);
        results.push({ schedule_id: schedule.id, status: "failed", error: errMsg });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Run scheduled captures error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateNextRun(cron: string): Date {
  const now = new Date();
  const parts = cron.split(" ");
  // Simple parsing for common patterns
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (hour === "*" && minute === "0") {
    // Every hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  if (hour.startsWith("*/")) {
    const interval = parseInt(hour.replace("*/", ""));
    return new Date(now.getTime() + interval * 60 * 60 * 1000);
  }
  if (dayOfWeek !== "*") {
    // Weekly
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // Default: daily
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}
