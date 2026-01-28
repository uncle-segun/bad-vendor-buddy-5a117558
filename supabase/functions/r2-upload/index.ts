import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.400.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.400.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize S3 client for R2
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
  // Handle CORS preflight
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const complaintId = formData.get("complaintId") as string;
    const originalFileName = formData.get("originalFileName") as string;

    if (!file || !complaintId) {
      return new Response(
        JSON.stringify({ error: "Missing file or complaintId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "webp";
    const fileName = `${complaintId}/${timestamp}-${randomSuffix}.${ext}`;

    // Upload to temporary bucket
    const r2Client = getR2Client();
    const tempBucket = Deno.env.get("R2_BUCKET_TEMP") || "evidence-temp";
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: tempBucket,
        Key: fileName,
        Body: uint8Array,
        ContentType: file.type,
        Metadata: {
          originalFileName: originalFileName || file.name,
          uploadedBy: user.id,
          complaintId: complaintId,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    // Generate a signed URL for immediate access (valid for 1 hour)
    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: tempBucket,
        Key: fileName,
      }),
      { expiresIn: 3600 }
    );

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        bucket: "temp",
        signedUrl,
        expiresIn: 3600,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("R2 upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
