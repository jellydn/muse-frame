import * as faceapi from 'face-api.js'

let modelsLoaded = false
let loadPromise: Promise<void> | null = null

const MODEL_URL = '/models'

export interface FaceDetectionResult {
  success: boolean
  faceCount: number
  error?: string
}

async function loadModels(): Promise<void> {
  if (modelsLoaded) return

  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)])
    modelsLoaded = true
  })()

  return loadPromise
}

export async function detectFaces(imageSource: string): Promise<FaceDetectionResult> {
  try {
    await loadModels()

    const image = new Image()
    image.src = imageSource

    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })

    // Create an off-screen canvas for face detection
    const canvas = document.createElement('canvas')
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)

    const detections = await faceapi.detectAllFaces(
      image,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }),
    )

    return {
      success: true,
      faceCount: detections.length,
    }
  } catch (error) {
    console.error('Face detection error:', error)
    return {
      success: false,
      faceCount: 0,
      error: error instanceof Error ? error.message : 'Failed to detect faces',
    }
  }
}

export function getFaceValidationMessage(faceCount: number): string {
  if (faceCount === 0) {
    return 'No face detected. Please upload a photo with a clearly visible face.'
  }
  if (faceCount > 1) {
    return `Multiple faces detected (${faceCount}). Please upload a photo with only one face.`
  }
  return ''
}
