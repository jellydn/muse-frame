import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { detectFaces, getFaceValidationMessage } from '~/lib/face-detection'
import { createCheckout } from '~/lib/server/stripe'
import { uploadPhoto } from '~/lib/server/upload'
import { getStyleById } from '~/lib/styles'

export const Route = createFileRoute('/upload')({
  component: UploadPage,
})

function UploadPage() {
  const { style: styleId } = Route.useSearch() as { style?: string }

  if (!styleId) {
    throw redirect({ to: '/' })
  }

  const style = getStyleById(styleId)

  if (!style) {
    throw redirect({ to: '/' })
  }

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [faceValidationStatus, setFaceValidationStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle')
  const [faceError, setFaceError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Email validation regex - wrapped in useCallback to satisfy linter
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return

    // Reset validation state
    setFaceValidationStatus('idle')
    setFaceError(null)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png']
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPEG or PNG image.')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.')
      return
    }

    setUploadedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreviewUrl(result)

      // Run face detection on the image
      setFaceValidationStatus('validating')
      detectFaces(result)
        .then((result) => {
          if (result.success && result.faceCount === 1) {
            setFaceValidationStatus('valid')
          } else {
            const message = result.error || getFaceValidationMessage(result.faceCount)
            setFaceError(message)
            setFaceValidationStatus('invalid')
          }
        })
        .catch((error) => {
          console.error('Face detection failed:', error)
          setFaceError('Failed to validate image. Please try again.')
          setFaceValidationStatus('invalid')
        })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setFaceValidationStatus('idle')
    setFaceError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleContinue = useCallback(async () => {
    // Reset error states
    setEmailError(null)
    setErrorMessage(null)

    // Validate email
    if (!email.trim()) {
      setEmailError('Please enter your email address.')
      return
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    // Validate file and face detection
    if (!uploadedFile || faceValidationStatus !== 'valid') {
      setErrorMessage('Please upload and validate a photo first.')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Upload photo to server
      const uploadResult = await uploadPhoto(uploadedFile, styleId)

      if (!uploadResult.success) {
        setErrorMessage(uploadResult.error || 'Failed to upload photo. Please try again.')
        setIsLoading(false)
        return
      }

      if (!uploadResult.uploadPath) {
        setErrorMessage('Failed to get upload path. Please try again.')
        setIsLoading(false)
        return
      }

      // Step 2: Create checkout session
      const checkoutResult = await createCheckout(styleId, uploadResult.uploadPath, email)

      if (!checkoutResult.success) {
        setErrorMessage(checkoutResult.error || 'Failed to create checkout. Please try again.')
        setIsLoading(false)
        return
      }

      // Step 3: Redirect to Stripe Checkout
      if (checkoutResult.checkoutUrl) {
        window.location.href = checkoutResult.checkoutUrl
      } else {
        setErrorMessage('Failed to get checkout URL. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [email, uploadedFile, faceValidationStatus, styleId, isValidEmail])

  // Get category color for styling
  const categoryColors: Record<string, string> = {
    girls: '#f8bbd9',
    boys: '#bbdefb',
    unisex: '#c8e6c9',
  }

  const categoryColor = categoryColors[style.category] || '#e0e0e0'

  return (
    <div className="upload-page">
      <div className="upload-header" style={{ backgroundColor: categoryColor }}>
        <div className="container">
          <a href="/" className="back-link">
            ← Back to Styles
          </a>
          <h1 className="upload-title">Upload Your Photo</h1>
        </div>
      </div>

      <div className="container">
        <div className="upload-content">
          {/* Style Info Card */}
          <div className="style-info-card">
            <div className="style-info-header">
              <span className={`style-category-badge ${style.category}`}>
                {style.category.charAt(0).toUpperCase() + style.category.slice(1)}
              </span>
              <span className="style-price">${(style.price / 100).toFixed(2)}</span>
            </div>
            <h2 className="style-name">{style.name}</h2>
            <p className="style-description">{style.description}</p>
          </div>

          {/* Email Input */}
          <div className="email-section">
            <div className="email-input-card">
              <label htmlFor="email" className="email-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="email-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(null)
                }}
                disabled={isLoading}
                required
              />
              <p className="email-hint">We'll send your portrait download link to this email</p>
              {emailError && <p className="email-error">{emailError}</p>}
            </div>
          </div>

          {/* Upload Zone */}
          <div className="upload-section">
            {!previewUrl ? (
              <button
                type="button"
                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={isLoading}
              >
                <div className="upload-icon">📷</div>
                <p className="upload-text">Drag and drop your photo here</p>
                <p className="upload-subtext">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleInputChange}
                  className="file-input"
                />
              </button>
            ) : (
              <div className="preview-container">
                <img src={previewUrl} alt="Uploaded preview" className="preview-image" />
                <button
                  type="button"
                  className="remove-button"
                  onClick={handleRemoveFile}
                  disabled={isLoading}
                >
                  Remove Photo
                </button>
                {/* Face Validation Status */}
                {faceValidationStatus === 'validating' && (
                  <div className="validation-status validating">
                    <span className="spinner" /> Validating photo...
                  </div>
                )}
                {faceValidationStatus === 'valid' && (
                  <div className="validation-status valid">
                    <span className="check-icon">✓</span> Photo validated - single face detected
                  </div>
                )}
                {faceValidationStatus === 'invalid' && faceError && (
                  <div className="validation-status error">
                    <span className="error-icon">✕</span> {faceError}
                  </div>
                )}
              </div>
            )}

            {/* Photo Requirements */}
            <div className="requirements-card">
              <h3 className="requirements-title">Photo Requirements</h3>
              <ul className="requirements-list">
                <li className="requirement-item">
                  <span className="requirement-icon">✓</span>
                  Format: JPEG or PNG
                </li>
                <li className="requirement-item">
                  <span className="requirement-icon">✓</span>
                  Maximum file size: 10MB
                </li>
                <li className="requirement-item">
                  <span className="requirement-icon">✓</span>
                  Single face clearly visible
                </li>
                <li className="requirement-item">
                  <span className="requirement-icon">✓</span>
                  Clear, well-lit photo
                </li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="error-message-card">
              <p className="error-message">{errorMessage}</p>
            </div>
          )}

          {/* Continue Button */}
          <div className="upload-actions">
            <button
              type="button"
              className="continue-button"
              onClick={handleContinue}
              disabled={!uploadedFile || faceValidationStatus !== 'valid' || !email || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" /> Processing...
                </>
              ) : faceValidationStatus === 'validating' ? (
                'Validating...'
              ) : faceValidationStatus === 'invalid' ? (
                faceError || 'Invalid image'
              ) : (
                'Continue to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
