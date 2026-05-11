import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime, PAYMENT_METHODS } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Sale {
  id: string
  customerName: string | null
  total: number
  paymentMethod: string
  createdAt: string
  items: { product: { name: string }; quantity: number }[]
}

interface RecentSalesProps {
  sales: Sale[]
}

const paymentBadgeVariant: Record<string, 'success' | 'default' | 'secondary'> = {
  cash: 'success',
  card: 'default',
  transfer: 'secondary',
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Ventas recientes</CardTitle>
        <Link
          href="/ventas"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay ventas recientes</p>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sale.customerName ?? 'Cliente sin nombre'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sale.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(sale.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(sale.total)}
                  </span>
                  <Badge variant={paymentBadgeVariant[sale.paymentMethod] ?? 'secondary'}>
                    {PAYMENT_METHODS[sale.paymentMethod] ?? sale.paymentMethod}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
