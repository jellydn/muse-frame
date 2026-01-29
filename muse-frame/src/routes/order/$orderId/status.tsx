import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getOrderById, regeneratePortrait } from '~/lib/server/orders'
import { getStyleById } from '~/lib/styles'

export const Route = createFileRoute('/order/$orderId/status')({
  component: OrderStatusPage,
  loader: ({ params }) => {
    const order = getOrderById(params.orderId)

    if (!order) {
      throw new Error('Order not found')
    }

    return { order }
  },
  errorComponent: () => {
    return (
      <div className="error-page">
        <div className="container">
          <h1>Order Not Found</h1>
          <p>The order you're looking for doesn't exist or has been removed.</p>
          <a href="/" className="back-link">
            Return to Home
          </a>
        </div>
      </div>
    )
  },
})

function RegenerateButton({ orderId }: { orderId: number }) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      const result = await regeneratePortrait(orderId)
      if (result.success) {
        // Reload to show generating status
        window.location.reload()
      } else {
        setError(result.error || 'Failed to start regeneration')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="regeneration-section">
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="regenerate-button"
      >
        {isRegenerating ? (
          <>
            <span className="spinner" /> Starting regeneration...
          </>
        ) : (
          'Regenerate Portrait (1 remaining)'
        )}
      </button>
      {error && <p className="regenerate-error">{error}</p>}
      <p className="regenerate-note">A new portrait will be generated and emailed to you.</p>
    </div>
  )
}

function OrderStatusPage() {
  const data = Route.useLoaderData() as {
    order: {
      id: number
      email: string
      style: string
      status: string
      outputPath: string | null
      regenerationUsed: boolean
      createdAt: Date
    }
  }

  const order = data.order
  const style = getStyleById(order.style)

  // Auto-refresh when status is 'paid' or 'generating'
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)

  useEffect(() => {
    if (order.status === 'paid' || order.status === 'generating') {
      setIsAutoRefreshing(true)

      const interval = setInterval(() => {
        window.location.reload()
      }, 5000)

      return () => clearInterval(interval)
    }

    setIsAutoRefreshing(false)
  }, [order.status])

  const statusSteps = [
    { key: 'paid', label: 'Payment' },
    { key: 'generating', label: 'Generating' },
    { key: 'complete', label: 'Complete' },
  ]

  const getStepStatus = (stepKey: string): 'complete' | 'current' | 'upcoming' => {
    const statusOrder = ['paid', 'generating', 'complete', 'failed', 'refunded']
    const currentIndex = statusOrder.indexOf(order.status)
    const stepIndex = statusOrder.indexOf(stepKey)

    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const formatDate = (date: Date): string => dateFormatter.format(date)

  return (
    <div className="status-page">
      <div className="status-header">
        <div className="container">
          <a href="/" className="back-link">
            ← Back to Styles
          </a>
          <h1 className="status-title">Order Status</h1>
          <p className="order-id">Order #{order.id}</p>
        </div>
      </div>

      <div className="container">
        <div className="status-content">
          <div className="order-summary-card">
            <h2 className="summary-title">Order Details</h2>

            <div className="summary-row">
              <span className="summary-label">Email</span>
              <span className="summary-value">{order.email}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Style</span>
              <span className="summary-value">{style?.name || order.style}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Ordered</span>
              <span className="summary-value">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="progress-card">
            <h2 className="progress-title">Generation Progress</h2>

            {order.status === 'paid' && (
              <div className="status-message">
                <span className="spinner" /> Payment confirmed! Your portrait is queued for
                generation.
              </div>
            )}

            {order.status === 'generating' && (
              <div className="status-message">
                <span className="spinner" /> Your portrait is being generated. This may take a few
                minutes...
              </div>
            )}

            {order.status === 'complete' && (
              <div className="status-message success">
                <span className="check-icon">✓</span> Your portrait is ready!
              </div>
            )}

            {order.status === 'failed' && (
              <div className="status-message error">
                <span className="error-icon">✕</span> Generation failed. Please contact support.
              </div>
            )}

            {order.status === 'refunded' && (
              <div className="status-message warning">
                <span className="warning-icon">!</span> This order has been refunded.
              </div>
            )}

            <div className="progress-steps">
              {statusSteps.map((step, index) => {
                const stepStatus = getStepStatus(step.key)
                const isLast = index === statusSteps.length - 1

                return (
                  <div key={step.key} className="progress-step-container">
                    <div className={`progress-step ${stepStatus}`}>
                      <div className="step-indicator">
                        {stepStatus === 'complete' && <span className="check-icon">✓</span>}
                        {stepStatus === 'current' && <span className="spinner" />}
                        {stepStatus === 'upcoming' && (
                          <span className="step-number">{index + 1}</span>
                        )}
                      </div>
                      <span className="step-label">{step.label}</span>
                    </div>
                    {!isLast && (
                      <div className={`step-connector ${stepStatus}`}>
                        <div className="connector-line" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isAutoRefreshing && (
              <p className="auto-refresh-note">Status updates automatically every 5 seconds</p>
            )}
          </div>

          {order.status === 'complete' && order.outputPath && (
            <div className="download-card">
              <h2 className="download-title">Your Portrait</h2>
              <div className="download-actions">
                <a
                  href={`/api/download/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-button"
                >
                  Download Portrait
                </a>
              </div>
              <p className="download-note">
                Download link expires in 7 days. A copy has also been sent to {order.email}.
              </p>

              {!order.regenerationUsed && <RegenerateButton orderId={order.id} />}
            </div>
          )}

          {order.status === 'failed' && (
            <div className="download-card">
              <h2 className="download-title">Generation Failed</h2>
              <p className="download-note">
                We couldn&apos;t generate your portrait. You can try again once.
              </p>
              <RegenerateButton orderId={order.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
