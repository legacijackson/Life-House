import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";

function getClient() {
  const endpoint = process.env.DO_SPACES_ENDPOINT || process.env.S3_ENDPOINT_URL || "https://sfo3.digitaloceanspaces.com";
  const region = process.env.DO_SPACES_REGION || process.env.S3_REGION || "sfo3";
  const key = process.env.DO_SPACES_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.DO_SPACES_SECRET || process.env.AWS_SECRET_ACCESS_KEY;

  if (!key || !secret) throw new Error("DigitalOcean Spaces credentials not configured (DO_SPACES_KEY / DO_SPACES_SECRET)");

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: key, secretAccessKey: secret },
    forcePathStyle: false,
  });
}

function getBucket() {
  return process.env.DO_SPACES_BUCKET || process.env.S3_BUCKET_NAME || "lifehouse";
}

export async function uploadToSpaces(opts: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
}): Promise<{ url: string; key: string }> {
  const client = getClient();
  const bucket = getBucket();
  const ext = path.extname(opts.originalName);
  const key = `${opts.folder ? opts.folder + "/" : ""}${randomUUID()}${ext}`;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: opts.buffer,
    ContentType: opts.mimeType,
    ACL: "private",
  }));

  const endpoint = process.env.DO_SPACES_ENDPOINT || "https://sfo3.digitaloceanspaces.com";
  const url = `${endpoint}/${bucket}/${key}`;
  return { url, key };
}

export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteFromSpaces(key: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function testSpacesConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getClient();
    const bucket = getBucket();
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { success: true, message: `Connected to DigitalOcean Spaces bucket: ${bucket}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to connect to DigitalOcean Spaces" };
  }
}
