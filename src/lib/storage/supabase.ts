import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// We use a singleton pattern to avoid creating multiple clients
export const supabase = createClient(
  supabaseUrl || "https://dummy.supabase.co",
  supabaseKey || "dummy-key"
);

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * 
 * @param file The file buffer or blob to upload
 * @param bucket The name of the storage bucket
 * @param folder Optional folder path within the bucket
 * @param contentType The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: Buffer | ArrayBuffer | Blob,
  bucket: string,
  folder: string = "",
  contentType: string = "application/pdf"
): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not configured");
  }

  // Generate a unique filename to prevent collisions
  const fileName = `${uuidv4()}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * 
 * @param url The full public URL of the file to delete
 * @param bucket The name of the storage bucket
 */
export async function deleteFile(url: string, bucket: string): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  if (!url) return;

  try {
    // Extract the file path from the URL
    // URL format is typically: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split(`/public/${bucket}/`);
    
    if (pathParts.length < 2) return;
    
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error("Supabase storage delete error:", error);
    }
  } catch (error) {
    console.error("Error parsing URL for deletion:", error);
  }
}
