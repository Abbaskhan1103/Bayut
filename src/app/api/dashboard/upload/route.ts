import { NextRequest, NextResponse } from "next/server";
import { dashboardGuard } from "../_guard";
import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = new Set(["posters", "logos"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

export async function POST(req: NextRequest) {
  const { error, centerId } = await dashboardGuard();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: "file, bucket, and path are required" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }
  // Ensure path is scoped to the center
  if (!path.startsWith(centerId + "/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[dashboard/upload]", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
