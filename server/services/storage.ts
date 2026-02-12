import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { magicNumbers } from '../utils/magicNumbers';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function uploadFileToStorage(
  buffer: Buffer,
  originalFilename: string,
  organizationId: string
): Promise<{ storageKey: string; mimeType: string; sizeBytes: number }> {
  const mimeType = magicNumbers(buffer) || 'application/octet-stream';
  if (!['application/pdf', 'text/plain'].includes(mimeType)) {
    throw new Error('Unsupported file type');
  }

  const ext = mimeType === 'application/pdf' ? 'pdf' : 'txt';
  const storageKey = `contracts/\( {organizationId}/ \){crypto.randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType,
    Metadata: { organizationId, originalFilename },
    ServerSideEncryption: 'AES256',
  }));

  return { storageKey, mimeType, sizeBytes: buffer.length };
}

export async function getSignedDownloadUrl(storageKey: string, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFileFromStorage(storageKey: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }));
}

export async function fileExists(storageKey: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: storageKey }));
    return true;
  } catch {
    return false;
  }
}