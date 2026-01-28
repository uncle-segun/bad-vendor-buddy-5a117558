import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AWS Signature V4 helper
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

async function signRequest(
  method: string,
  url: string,
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  headers: Record<string, string> = {},
  body?: ArrayBuffer
): Promise<Record<string, string>> {
  const parsedUrl = new URL(url);
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const region = "auto";
  const service = "s3";
  
  const contentHash = body 
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)))
        .map(b => b.toString(16).padStart(2, '0')).join('')
    : "UNSIGNED-PAYLOAD";

  const signedHeadersList = ["host", "x-amz-content-sha256", "x-amz-date", ...Object.keys(headers).map(h => h.toLowerCase())].sort();
  const signedHeaders = signedHeadersList.join(";");
  
  let canonicalHeaders = `host:${parsedUrl.host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDate}\n`;
  for (const key of Object.keys(headers).sort()) {
    canonicalHeaders += `${key.toLowerCase()}:${headers[key]}\n`;
  }
  
  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    contentHash
  ].join("\n");
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256(new Uint8Array(kDate), region);
  const kService = await hmacSha256(new Uint8Array(kRegion), service);
  const kSigning = await hmacSha256(new Uint8Array(kService), "aws4_request");
  const signature = Array.from(new Uint8Array(await hmacSha256(new Uint8Array(kSigning), stringToSign)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    "x-amz-content-sha256": contentHash,
    "x-amz-date": amzDate,
    "Authorization": `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    ...headers
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and moderator/admin role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use anon key to verify user
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is moderator or admin using service role
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["moderator", "admin"])
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { complaintId, action } = await req.json();

    if (!complaintId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing complaintId or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Get all evidence for this complaint
    const { data: evidenceFiles, error: evidenceError } = await supabaseService
      .from("evidence")
      .select("*")
      .eq("complaint_id", complaintId);

    if (evidenceError) {
      throw evidenceError;
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    if (action === "approve") {
      // Move files from temp to permanent bucket
      for (const evidence of evidenceFiles || []) {
        const filePath = evidence.file_url;
        
        try {
          // First, get the object from temp bucket
          const getUrl = `${endpoint}/${tempBucket}/${filePath}`;
          const getHeaders = await signRequest("GET", getUrl, accountId, accessKeyId, secretAccessKey);
          
          const getResponse = await fetch(getUrl, {
            method: "GET",
            headers: getHeaders,
          });

          if (!getResponse.ok) {
            console.error(`Failed to get file ${filePath}:`, await getResponse.text());
            continue;
          }

          const fileData = await getResponse.arrayBuffer();
          const contentType = getResponse.headers.get("content-type") || "application/octet-stream";

          // Put in permanent bucket
          const putUrl = `${endpoint}/${permBucket}/${filePath}`;
          const putHeaders = await signRequest(
            "PUT", 
            putUrl, 
            accountId, 
            accessKeyId, 
            secretAccessKey, 
            { "Content-Type": contentType },
            fileData
          );
          
          const putResponse = await fetch(putUrl, {
            method: "PUT",
            headers: { ...putHeaders, "Content-Type": contentType },
            body: fileData,
          });

          if (!putResponse.ok) {
            console.error(`Failed to put file ${filePath}:`, await putResponse.text());
            continue;
          }

          // Delete from temp bucket
          const deleteUrl = `${endpoint}/${tempBucket}/${filePath}`;
          const deleteHeaders = await signRequest("DELETE", deleteUrl, accountId, accessKeyId, secretAccessKey);
          
          await fetch(deleteUrl, {
            method: "DELETE",
            headers: deleteHeaders,
          });

          // Update the evidence record to indicate it's in permanent storage
          await supabaseService
            .from("evidence")
            .update({ 
              description: (evidence.description || "") + " [storage:permanent]" 
            })
            .eq("id", evidence.id);

          console.log(`Moved ${filePath} to permanent storage`);
        } catch (err) {
          console.error(`Error processing file ${filePath}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Moved ${evidenceFiles?.length || 0} files to permanent storage` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "reject") {
      // Files will be auto-deleted by R2 lifecycle rules after 7 days
      console.log(`Complaint ${complaintId} rejected - evidence will be auto-deleted after 7 days`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Evidence will be automatically deleted after 7 days" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing evidence:", error);
    const message = error instanceof Error ? error.message : "Failed to process evidence";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
