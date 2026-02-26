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

  const SCREENSHOTONE_API_KEY = Deno.env.get("SCREENSHOTONE_API_KEY");
  if (!SCREENSHOTONE_API_KEY) {
    return new Response(JSON.stringify({ error: "SCREENSHOTONE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if called with a specific job_id or process all queued
  let jobIds: string[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (body.job_ids) jobIds = body.job_ids;
  } catch {
    // no body, process all queued
  }

  try {
    // Fetch queued jobs
    let query = supabase
      .from("capture_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(10);

    if (jobIds.length > 0) {
      query = query.in("id", jobIds);
    }

    const { data: jobs, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No queued jobs", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const job of jobs) {
      // Mark as processing
      await supabase
        .from("capture_jobs")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", job.id);

      try {
        // Build ScreenshotOne URL
        const params = new URLSearchParams({
          access_key: SCREENSHOTONE_API_KEY,
          url: job.url,
          viewport_width: String(job.viewport_width),
          viewport_height: String(job.viewport_height),
          device_scale_factor: String(job.device_scale_factor),
          format: job.output_format === "pdf" ? "pdf" : job.output_format,
          full_page: String(job.full_page),
          delay: String(job.delay_seconds),
          block_cookie_banners: String(job.hide_cookie_banners),
          block_chats: String(job.hide_chat_widgets),
          block_ads: String(job.hide_popups),
        });

        // Custom CSS injection
        if (job.custom_css) {
          params.set("css", job.custom_css);
        }

        if (job.background === "transparent") {
          params.set("omit_background", "true");
        } else if (job.background === "dark") {
          params.set("dark_mode", "true");
        }

        const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`;
        const screenshotRes = await fetch(screenshotUrl);

        if (!screenshotRes.ok) {
          const errText = await screenshotRes.text();
          throw new Error(`ScreenshotOne API error [${screenshotRes.status}]: ${errText}`);
        }

        const imageBuffer = await screenshotRes.arrayBuffer();
        const ext = job.output_format;
        const filePath = `${job.user_id}/${job.id}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("screenshots")
          .upload(filePath, imageBuffer, {
            contentType: ext === "pdf" ? "application/pdf" : `image/${ext}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("screenshots")
          .getPublicUrl(filePath);

        // Since bucket is private, create a signed URL instead
        const { data: signedData } = await supabase.storage
          .from("screenshots")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

        const fileUrl = signedData?.signedUrl || urlData.publicUrl;

        // Create capture asset record
        const { error: assetError } = await supabase.from("capture_assets").insert({
          job_id: job.id,
          user_id: job.user_id,
          file_path: filePath,
          file_url: fileUrl,
          format: ext,
          width: job.viewport_width * job.device_scale_factor,
          height: job.full_page ? null : job.viewport_height * job.device_scale_factor,
          file_size_bytes: imageBuffer.byteLength,
          is_annotation: false,
        });

        if (assetError) throw assetError;

        // Mark completed
        await supabase
          .from("capture_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job.id);

        results.push({ job_id: job.id, status: "completed" });
      } catch (jobErr: unknown) {
        const errMsg = jobErr instanceof Error ? jobErr.message : "Unknown error";
        console.error(`Job ${job.id} failed:`, errMsg);

        await supabase
          .from("capture_jobs")
          .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
          .eq("id", job.id);

        results.push({ job_id: job.id, status: "failed", error: errMsg });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Process captures error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
