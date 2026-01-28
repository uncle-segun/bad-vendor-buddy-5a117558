import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Validate access permissions using the database function
    const { data: hasAccess, error: accessError } = await supabase.rpc('can_access_evidence_file', {
      _file_path: filePath
    });

    if (accessError) {
      console.error("Error checking access:", accessError);
      return new Response(
        JSON.stringify({ error: "Access check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasAccess) {
      console.log(`Access denied for user ${user.id} to file ${filePath}`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get R2 configuration
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const tempBucket = Deno.env.get("R2_BUCKET_TEMP") || "evidence-temp";
    const permBucket = Deno.env.get("R2_BUCKET_PERMANENT") || "evidence-permanent";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: "Missing R2 configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bucketName = bucket === "permanent" ? permBucket : tempBucket;
    const expiresIn = 3600; // 1 hour

    // Generate presigned URL using AWS Signature V4
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const region = "auto";
    const service = "s3";
    
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    
    // Build query string for presigned URL
    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": expiresIn.toString(),
      "X-Amz-SignedHeaders": "host",
    });

    const canonicalUri = `/${bucketName}/${filePath}`;
    const canonicalQueryString = queryParams.toString().replace(/\+/g, '%20');
    const canonicalHeaders = `host:${accountId}.r2.cloudflarestorage.com\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";
    
    const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    
    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256";
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
    
    queryParams.set("X-Amz-Signature", signatureHex);
    
    const signedUrl = `${endpoint}${canonicalUri}?${queryParams.toString()}`;

    console.log(`Generated signed URL for ${filePath} in bucket ${bucketName} for user ${user.id}`);

    return new Response(
      JSON.stringify({ signedUrl, expiresIn }),
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
