'use server'

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { env } from '~/lib/env'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

export interface GeneratePortraitResult {
  success: boolean
  outputPath?: string
  error?: string
}

// Modal API endpoint - this would be your Modal app's webhook URL
const MODAL_API_URL = 'https://your-modal-app.modal.run/generate'

// Timeout for generation in milliseconds (5 minutes)
const GENERATION_TIMEOUT = 5 * 60 * 1000

export async function generatePortrait(
  uploadPath: string,
  promptTemplate: string,
): Promise<GeneratePortraitResult> {
  // Validate inputs
  if (!uploadPath) {
    return {
      success: false,
      error: 'Upload path is required.',
    }
  }

  if (!promptTemplate) {
    return {
      success: false,
      error: 'Prompt template is required.',
    }
  }

  try {
    // Get the uploaded image from R2
    const getCommand = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: uploadPath,
    })

    const uploadResponse = await s3Client.send(getCommand)

    if (!uploadResponse.Body) {
      return {
        success: false,
        error: 'Failed to retrieve uploaded image.',
      }
    }

    // Convert stream to buffer
    const imageBuffer = await streamToBuffer(uploadResponse.Body as NodeJS.ReadableStream)

    // Convert image to base64 for Modal API
    const imageBase64 = imageBuffer.toString('base64')
    const contentType = uploadResponse.ContentType || 'image/jpeg'

    // Build the full prompt by combining template with base image reference
    // Note: The actual prompt construction depends on your Modal model
    const fullPrompt = `${promptTemplate} The subject should be portrayed in this artistic style with the reference image provided. High quality, detailed, 1024x1024 resolution.`

    // Call Modal API for image generation
    const response = await fetch(MODAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MODAL_TOKEN_ID}:${env.MODAL_TOKEN_SECRET}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image: imageBase64,
        content_type: contentType,
        width: 1024,
        height: 1024,
        num_inference_steps: 20,
        guidance_scale: 7.5,
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Modal API error:', errorText)
      return {
        success: false,
        error: `Generation failed: ${response.statusText}`,
      }
    }

    // Get the generated image from Modal response
    const responseData = await response.json()

    // If Modal returns base64 image
    if (responseData.image) {
      const generatedImageBuffer = Buffer.from(responseData.image, 'base64')

      // Upload generated image to R2
      const outputFilename = `outputs/${uuidv4()}.png`
      const outputPath = `generated/${outputFilename}`

      const putCommand = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: outputPath,
        Body: generatedImageBuffer,
        ContentType: 'image/png',
      })

      await s3Client.send(putCommand)

      return {
        success: true,
        outputPath,
      }
    }

    // If Modal returns a URL to the generated image
    if (responseData.url) {
      const generatedImageResponse = await fetch(responseData.url)
      const generatedImageBuffer = await generatedImageResponse.arrayBuffer()

      // Upload generated image to R2
      const outputFilename = `outputs/${uuidv4()}.png`
      const outputPath = `generated/${outputFilename}`

      const putCommand = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: outputPath,
        Body: new Uint8Array(generatedImageBuffer),
        ContentType: 'image/png',
      })

      await s3Client.send(putCommand)

      return {
        success: true,
        outputPath,
      }
    }

    return {
      success: false,
      error: 'No generated image in response.',
    }
  } catch (error) {
    console.error('Portrait generation error:', error)

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        error: 'Generation timed out after 5 minutes. Please try again.',
      }
    }

    return {
      success: false,
      error: 'Failed to generate portrait. Please try again.',
    }
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array)
  }
  return Buffer.concat(chunks)
}
