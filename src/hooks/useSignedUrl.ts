import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlResult {
  signedUrl: string | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Hook to generate a signed URL for a file stored in a private Supabase storage bucket.
 * Signed URLs are generated on-demand and expire after the specified duration.
 * 
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export const useSignedUrl = (
  bucket: string,
  filePath: string | null,
  expiresIn: number = 3600
): SignedUrlResult => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to generate signed URL'));
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [bucket, filePath, expiresIn]);

  return { signedUrl, error, isLoading };
};

/**
 * Helper function to generate a signed URL on-demand.
 * Use this when you need to generate URLs for multiple files.
 * 
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export const getSignedUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
};

/**
 * Helper function to extract the file path from a stored URL or path.
 * Handles both full URLs and relative paths.
 * 
 * @param storedValue - The value stored in the database (URL or path)
 * @param bucket - The bucket name to extract path from URL
 */
export const extractFilePath = (storedValue: string, bucket: string): string => {
  // If it's already a path (not a URL), return as-is
  if (!storedValue.startsWith('http')) {
    return storedValue;
  }

  // Try to extract path from URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  // or signed: https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=xxx
  try {
    const url = new URL(storedValue);
    const pathParts = url.pathname.split(`/${bucket}/`);
    if (pathParts.length > 1) {
      return pathParts[1].split('?')[0]; // Remove query params
    }
  } catch {
    // If URL parsing fails, try simple string extraction
    const bucketPattern = `/${bucket}/`;
    const index = storedValue.indexOf(bucketPattern);
    if (index !== -1) {
      return storedValue.slice(index + bucketPattern.length).split('?')[0];
    }
  }

  // Return original if we can't extract path
  return storedValue;
};
