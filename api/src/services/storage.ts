import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
});

export const AVATAR_BUCKET = process.env.S3_AVATAR_BUCKET ?? "judge-avatars";

const publicBase = process.env.S3_PUBLIC_URL ?? "http://localhost:9000";

// Transforme une clé d'objet en URL publique chargeable par le navigateur.
export function avatarUrl(key: string | null): string | null {
  return key ? `${publicBase}/${AVATAR_BUCKET}/${key}` : null;
}