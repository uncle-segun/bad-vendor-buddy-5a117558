import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get R2 configuration
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const tempBucket = Deno.env.get("R2_BUCKET_TEMP") || "evidence-temp";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: "Missing R2 configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "webp";
    const fileName = `${complaintId}/${timestamp}-${randomSuffix}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    // Use R2 S3-compatible API directly with fetch
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${tempBucket}/${fileName}`;
    const date = new Date().toUTCString();
    
    // Create AWS Signature V4 for R2 (simplified for PUT)
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const region = "auto";
    const service = "s3";
    
    // Calculate content hash
    const contentHash = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const contentHashHex = Array.from(new Uint8Array(contentHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create canonical request
    const method = "PUT";
    const canonicalUri = `/${tempBucket}/${fileName}`;
    const canonicalQueryString = "";
    const canonicalHeaders = 
      `content-type:${file.type}\n` +
      `host:${accountId}.r2.cloudflarestorage.com\n` +
      `x-amz-content-sha256:${contentHashHex}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;
    
    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;
    
    // Calculate signature
    async function hmacSha256(key: Uint8Array, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key as BufferSource,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    }
    
    const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
    const kRegion = await hmacSha256(new Uint8Array(kDate), region);
    const kService = await hmacSha256(new Uint8Array(kRegion), service);
    const kSigning = await hmacSha256(new Uint8Array(kService), "aws4_request");
    const signature = await hmacSha256(new Uint8Array(kSigning), stringToSign);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    // Upload to R2
    const uploadResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-amz-content-sha256": contentHashHex,
        "x-amz-date": amzDate,
        "Authorization": authorizationHeader,
        "x-amz-meta-original-filename": originalFileName || file.name,
        "x-amz-meta-uploaded-by": user.id,
        "x-amz-meta-complaint-id": complaintId,
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("R2 upload error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to upload to R2", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully uploaded ${fileName} to R2 bucket ${tempBucket}`);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        bucket: "temp",
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
