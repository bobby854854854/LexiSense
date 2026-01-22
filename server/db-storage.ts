import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import pdf from 'pdf-parse'

// This is a mock S3 client. In a real production environment,
// you would configure this with actual AWS credentials and region.
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:9000', // Using a localstack/minio endpoint for dev
  credentials: {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = 'lexisense-contracts'

/**
 * Extracts text content from a file buffer based on its MIME type.
 * @param fileBuffer The raw file buffer.
 * @param mimeType The MIME type of the file (e.g., 'application/pdf', 'text/plain').
 * @returns A promise that resolves to the extracted text content.
 */
async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdf(fileBuffer)
    return data.text
  } else if (mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8')
  }
  // Future: Add support for .docx, .rtf etc.
  throw new Error(`Unsupported file type: ${mimeType}`)
}

/**
 * Uploads a file to the mock S3 storage and extracts its text content.
 * @param fileBuffer The raw file buffer of the file.
 * @param originalName The original name of the file.
 * @param organizationId The ID of the organization the file belongs to.
 * @returns A promise that resolves to an object containing the storageKey and the extracted textContent.
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  organizationId: string,
): Promise<{ storageKey: string; textContent: string }> {
  console.log('[Storage] Starting file upload and text extraction...')

  const textContent = await extractTextFromFile(fileBuffer, mimeType)

  const storageKey = `${organizationId}/${uuidv4()}-${originalName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    Body: fileBuffer,
    ContentType: mimeType,
  })

  try {
    // In a real app, this would upload to S3. Here, we're just logging.
    // await s3Client.send(command);
    console.log(
      `[Storage] Mock S3 Upload Complete. Storage Key: ${storageKey}`,
    )
  } catch (err) {
    console.error('[Storage] Mock S3 Upload Failed:', err)
    throw new Error('Failed to upload file to storage.')
  }

  console.log(
    `[Storage] Text extracted successfully. Character count: ${textContent.length}`,
  )
  return { storageKey, textContent }
}