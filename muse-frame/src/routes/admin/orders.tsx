import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  adminRefundOrder,
  adminRetryGeneration,
  getAdminOrders,
  getOrderSummary,
} from '~/lib/server/admin'

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrdersPage,
  loader: () => {
    return {
      orders: getAdminOrders(),
      summary: getOrderSummary(),
    }
  },
})

interface OrderListItem {
  id: number
  email: string
  style: string
  status: string
  outputPath: string | null
  regenerationUsed: boolean
  createdAt: Date
  updatedAt: Date
}

interface OrderSummary {
  total: number
  byStatus: Record<string, number>
  successRate: number
}

function AdminOrdersPage() {
  const data = Route.useLoaderData() as { orders: OrderListItem[]; summary: OrderSummary }
  const [orders, setOrders] = useState(data.orders)
  const [summary, setSummary] = useState(data.summary)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Refresh orders when filter changes
  useEffect(() => {
    const filteredOrders = getAdminOrders({ status: statusFilter })
    setOrders(filteredOrders)
  }, [statusFilter])

  const handleRetry = async (orderId: number) => {
    setActionLoading(orderId)
    setActionError(null)

    try {
      const result = await adminRetryGeneration(orderId)
      if (result.success) {
        // Refresh orders
        const updatedOrders = getAdminOrders({ status: statusFilter })
        setOrders(updatedOrders)
        const updatedSummary = getOrderSummary()
        setSummary(updatedSummary)
      } else {
        setActionError(result.error || 'Retry failed')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefund = async (orderId: number) => {
    if (!confirm(`Are you sure you want to refund order #${orderId}?`)) {
      return
    }

    setActionLoading(orderId)
    setActionError(null)

    try {
      const result = await adminRefundOrder(orderId)
      if (result.success) {
        // Refresh orders
        const updatedOrders = getAdminOrders({ status: statusFilter })
        setOrders(updatedOrders)
        const updatedSummary = getOrderSummary()
        setSummary(updatedSummary)
      } else {
        setActionError(result.error || 'Refund failed')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date))
  }

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'complete':
        return 'status-badge complete'
      case 'failed':
        return 'status-badge failed'
      case 'refunded':
        return 'status-badge refunded'
      case 'generating':
        return 'status-badge generating'
      default:
        return 'status-badge'
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="container">
          <h1 className="admin-title">Admin Dashboard</h1>
          <a href="/" className="back-link">
            Back to Home
          </a>
        </div>
      </div>

      <div className="container">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3 className="summary-card-title">Total Orders</h3>
            <p className="summary-card-value">{summary.total}</p>
          </div>
          <div className="summary-card">
            <h3 className="summary-card-title">Success Rate</h3>
            <p className="summary-card-value">{summary.successRate}%</p>
          </div>
          <div className="summary-card">
            <h3 className="summary-card-title">Pending</h3>
            <p className="summary-card-value">{summary.byStatus.pending || 0}</p>
          </div>
          <div className="summary-card">
            <h3 className="summary-card-title">Complete</h3>
            <p className="summary-card-value">{summary.byStatus.complete || 0}</p>
          </div>
          <div className="summary-card">
            <h3 className="summary-card-title">Failed</h3>
            <p className="summary-card-value">{summary.byStatus.failed || 0}</p>
          </div>
        </div>

        {actionError && <p className="error-banner">{actionError}</p>}

        {/* Orders Table */}
        <div className="orders-section">
          <div className="orders-header">
            <h2 className="orders-title">Orders</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="generating">Generating</option>
              <option value="complete">Complete</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Email</th>
                  <th>Style</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td className="order-email">{order.email}</td>
                    <td className="order-style">{order.style}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                    <td className="order-date">{formatDate(order.createdAt)}</td>
                    <td className="order-actions">
                      {order.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(order.id)}
                          disabled={actionLoading === order.id}
                          className="action-button retry"
                        >
                          {actionLoading === order.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                      {(order.status === 'paid' || order.status === 'failed') && (
                        <button
                          type="button"
                          onClick={() => handleRefund(order.id)}
                          disabled={actionLoading === order.id}
                          className="action-button refund"
                        >
                          {actionLoading === order.id ? 'Refunding...' : 'Refund'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="no-orders">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
