/**
 * R2 Storage client utilities
 * Handles uploads and signed URL generation for Cloudflare R2
 */

import { supabase } from "@/integrations/supabase/client";
import { processFileForUpload } from "./imageUtils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UploadResult {
  success: boolean;
  filePath?: string;
  signedUrl?: string;
  error?: string;
}

/**
 * Upload a file to R2 storage (temporary bucket)
 * Images are automatically converted to WebP format
 */
export async function uploadToR2(
  file: File,
  complaintId: string
): Promise<UploadResult> {
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Process the file (convert images to WebP)
    const { blob, fileName, mimeType } = await processFileForUpload(file);

    // Create form data for upload
    const formData = new FormData();
    formData.append("file", new File([blob], fileName, { type: mimeType }));
    formData.append("complaintId", complaintId);
    formData.append("originalFileName", file.name);

    // Call the edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Upload failed" };
    }

    return {
      success: true,
      filePath: data.filePath,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Upload failed" 
    };
  }
}

/**
 * Get a signed URL for accessing a file in R2
 */
export async function getR2SignedUrl(
  filePath: string,
  bucket: "temp" | "permanent" = "temp"
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-get-signed-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath, bucket }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to get signed URL:", data.error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
}

/**
 * Approve or reject evidence for a complaint
 * This moves files between temp and permanent buckets
 */
export async function processEvidence(
  complaintId: string,
  action: "approve" | "reject"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/r2-approve-evidence`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ complaintId, action }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to process evidence" };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error("Error processing evidence:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process evidence" 
    };
  }
}
