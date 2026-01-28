import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.400.0";

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

    // Get all evidence for this complaint
    const { data: evidenceFiles, error: evidenceError } = await supabaseService
      .from("evidence")
      .select("*")
      .eq("complaint_id", complaintId);

    if (evidenceError) {
      throw evidenceError;
    }

    const r2Client = getR2Client();
    const tempBucket = Deno.env.get("R2_BUCKET_TEMP") || "evidence-temp";
    const permBucket = Deno.env.get("R2_BUCKET_PERMANENT") || "evidence-permanent";

    if (action === "approve") {
      // Move files from temp to permanent bucket
      for (const evidence of evidenceFiles || []) {
        const filePath = evidence.file_url;
        
        // Copy to permanent bucket
        await r2Client.send(
          new CopyObjectCommand({
            Bucket: permBucket,
            Key: filePath,
            CopySource: `${tempBucket}/${filePath}`,
          })
        );

        // Delete from temp bucket
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: tempBucket,
            Key: filePath,
          })
        );

        // Update the evidence record to indicate it's in permanent storage
        await supabaseService
          .from("evidence")
          .update({ 
            description: (evidence.description || "") + " [storage:permanent]" 
          })
          .eq("id", evidence.id);
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
      // Just update the complaint status
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
