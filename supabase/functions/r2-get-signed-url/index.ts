import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.400.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.400.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getR2Client() {
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 configuration");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { filePath, bucket = "temp" } = await req.json();

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "Missing filePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const r2Client = getR2Client();
    const bucketName = bucket === "permanent" 
      ? (Deno.env.get("R2_BUCKET_PERMANENT") || "evidence-permanent")
      : (Deno.env.get("R2_BUCKET_TEMP") || "evidence-temp");

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      }),
      { expiresIn: 3600 }
    );

    return new Response(
      JSON.stringify({ signedUrl, expiresIn: 3600 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating signed URL:", error);
    const message = error instanceof Error ? error.message : "Failed to generate signed URL";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
