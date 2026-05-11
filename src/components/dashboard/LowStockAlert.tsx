import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface LowStockItem {
  id: string
  productName: string
  size: string
  color: string
  quantity: number
}

interface LowStockAlertProps {
  items: LowStockItem[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Stock bajo
        </CardTitle>
        <Link
          href="/stock"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Ver stock <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No hay alertas de stock bajo
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    Talle: {item.size} | Color: {item.color}
                  </p>
                </div>
                <Badge variant={item.quantity === 0 ? 'danger' : 'warning'}>
                  {item.quantity === 0 ? 'Sin stock' : `${item.quantity} uds`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
