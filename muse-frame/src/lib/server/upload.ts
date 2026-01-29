'use server'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { env } from '~/lib/env'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

export interface UploadPhotoResult {
  success: boolean
  uploadPath?: string
  error?: string
}

export async function uploadPhoto(file: File, styleId: string): Promise<UploadPhotoResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Only JPEG and PNG images are allowed.',
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is 10MB (file is ${(file.size / 1024 / 1024).toFixed(2)}MB).`,
    }
  }

  try {
    // Generate unique filename
    const fileExtension = file.type === 'image/png' ? 'png' : 'jpg'
    const uniqueFilename = `${styleId}/${uuidv4()}.${fileExtension}`
    const uploadPath = `uploads/${uniqueFilename}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: uploadPath,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    return {
      success: true,
      uploadPath,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file. Please try again.',
    }
  }
}
