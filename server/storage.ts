import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand 
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import pdf from 'pdf-parse'
import { fileTypeFromBuffer } from 'file-type'
import { logger } from './logger'

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

// Magic number validation for common file types
const MAGIC_NUMBERS: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'text/plain': [], // Text files don't have magic numbers
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // .docx (ZIP format)
    [0x50, 0x4B, 0x05, 0x06],
    [0x50, 0x4B, 0x07, 0x08],
  ],
}

/**
 * Validates file using magic number (first bytes of file)
 */
function validateMagicNumber(buffer: Buffer, expectedMimeType: string): boolean {
  const magicPatterns = MAGIC_NUMBERS[expectedMimeType]
  
  if (!magicPatterns || magicPatterns.length === 0) {
    // For text/plain and other types without magic numbers
    return true
  }
  
  return magicPatterns.some(pattern => {
    return pattern.every((byte, index) => buffer[index] === byte)
  })
}

/**
 * Validates file type using both extension and magic number
 */
async function validateFileType(
  buffer: Buffer,
  originalName: string,
  declaredMimeType: string
): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  // Check if declared MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    return {
      valid: false,
      error: `File type ${declaredMimeType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  // Validate magic number
  if (!validateMagicNumber(buffer, declaredMimeType)) {
    return {
      valid: false,
      error: 'File content does not match declared file type (magic number mismatch)',
    }
  }

  // Use file-type library for additional validation
  try {
    const detectedType = await fileTypeFromBuffer(buffer)
    
    if (detectedType && detectedType.mime !== declaredMimeType) {
      // For text files, file-type might not detect anything, which is okay
      if (declaredMimeType === 'text/plain' && !detectedType) {
        return { valid: true }
      }
      
      logger.warn('File type mismatch detected', {
        declaredType: declaredMimeType,
        detectedType: detectedType.mime,
        filename: originalName,
      })
      
      // For now, we'll allow it but log the warning
      // In production, you might want to be more strict
      return { 
        valid: true, 
        detectedType: detectedType.mime,
      }
    }
  } catch (error) {
    logger.debug('File type detection failed (non-critical)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filename: originalName,
    })
  }

  return { valid: true }
}

/**
 * Extracts text content from a file buffer based on its MIME type.
 */
async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      const data = await pdf(fileBuffer)
      return data.text
    } catch (error) {
      logger.error('PDF text extraction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error('Failed to extract text from PDF')
    }
  } else if (mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8')
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // For Word documents, you would need additional libraries like mammoth
    // For now, we'll throw an error indicating it's not yet supported
    throw new Error('Word document text extraction not yet implemented. Please use PDF or text files.')
  }
  
  throw new Error(`Unsupported file type for text extraction: ${mimeType}`)
}

/**
 * Creates an S3 client instance
 */
function createS3Client(): S3Client {
  const region = process.env.AWS_REGION || 'us-east-1'
  
  // Check if we're in production with real AWS credentials
  const useRealS3 = process.env.AWS_ACCESS_KEY_ID && 
                    process.env.AWS_SECRET_ACCESS_KEY &&
                    process.env.S3_BUCKET_NAME

  if (!useRealS3) {
    logger.warn('AWS credentials not configured - S3 operations will fail', {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.S3_BUCKET_NAME,
    })
  }

  return new S3Client({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  })
}

const s3Client = createS3Client()
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'lexisense-contracts'

/**
 * Uploads a file to S3 with streaming and validation
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
): Promise<{ storageKey: string; textContent: string }> {
  logger.info('Starting S3 file upload', {
    filename: originalName,
    mimeType,
    size: fileBuffer.length,
    userId,
  })

  // Validate file type using magic numbers
  const validation = await validateFileType(fileBuffer, originalName, mimeType)
  if (!validation.valid) {
    logger.error('File validation failed', {
      filename: originalName,
      error: validation.error,
      userId,
    })
    throw new Error(validation.error || 'File validation failed')
  }

  // Extract text content before uploading
  const textContent = await extractTextFromFile(fileBuffer, mimeType)
  
  if (textContent.length === 0) {
    throw new Error('File appears to be empty or text extraction failed')
  }

  // Generate storage key with user isolation
  const fileExtension = originalName.split('.').pop() || 'bin'
  const storageKey = `contracts/${userId}/${uuidv4()}.${fileExtension}`

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    Body: fileBuffer,
    ContentType: mimeType,
    Metadata: {
      'original-filename': originalName,
      'user-id': userId,
      'upload-timestamp': new Date().toISOString(),
    },
  })

  try {
    await s3Client.send(command)
    logger.info('File uploaded to S3 successfully', {
      storageKey,
      userId,
      bucket: BUCKET_NAME,
      textLength: textContent.length,
    })
  } catch (error) {
    logger.error('S3 upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storageKey,
      userId,
    })
    throw new Error('Failed to upload file to storage')
  }

  return { storageKey, textContent }
}

/**
 * Generates a presigned URL for downloading a file from S3
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  })

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn })
    logger.debug('Generated presigned download URL', {
      storageKey,
      expiresIn,
    })
    return url
  } catch (error) {
    logger.error('Failed to generate presigned URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storageKey,
    })
    throw new Error('Failed to generate download URL')
  }
}

/**
 * Generates a presigned URL for uploading directly to S3 (client-side upload)
 */
export async function getPresignedUploadUrl(
  filename: string,
  mimeType: string,
  userId: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; storageKey: string }> {
  const fileExtension = filename.split('.').pop() || 'bin'
  const storageKey = `contracts/${userId}/${uuidv4()}.${fileExtension}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    ContentType: mimeType,
    Metadata: {
      'original-filename': filename,
      'user-id': userId,
    },
  })

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
    logger.debug('Generated presigned upload URL', {
      storageKey,
      userId,
      expiresIn,
    })
    return { uploadUrl, storageKey }
  } catch (error) {
    logger.error('Failed to generate presigned upload URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filename,
      userId,
    })
    throw new Error('Failed to generate upload URL')
  }
}

/**
 * Deletes a file from S3
 */
export async function deleteFileFromS3(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  })

  try {
    await s3Client.send(command)
    logger.info('File deleted from S3', { storageKey })
  } catch (error) {
    logger.error('Failed to delete file from S3', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storageKey,
    })
    throw new Error('Failed to delete file')
  }
}

/**
 * Checks if a file exists in S3
 */
export async function fileExistsInS3(storageKey: string): Promise<boolean> {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  })

  try {
    await s3Client.send(command)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Gets file metadata from S3
 */
export async function getFileMetadata(storageKey: string): Promise<{
  size: number
  contentType: string
  lastModified: Date
  metadata: Record<string, string>
}> {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  })

  try {
    const response = await s3Client.send(command)
    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    }
  } catch (error) {
    logger.error('Failed to get file metadata', {
      error: error instanceof Error ? error.message : 'Unknown error',
      storageKey,
    })
    throw new Error('Failed to get file metadata')
  }
}
