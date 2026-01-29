import { createFileRoute, redirect } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return

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
      setPreviewUrl(e.target?.result as string)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleContinue = () => {
    // Navigate to checkout - for now, just log and redirect with query params
    window.location.href = `/checkout?style=${styleId}&hasImage=true`
  }

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

          {/* Upload Zone */}
          <div className="upload-section">
            {!previewUrl ? (
              <button
                type="button"
                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
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
                <button type="button" className="remove-button" onClick={handleRemoveFile}>
                  Remove Photo
                </button>
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

          {/* Continue Button */}
          <div className="upload-actions">
            <button
              type="button"
              className="continue-button"
              onClick={handleContinue}
              disabled={!uploadedFile}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
