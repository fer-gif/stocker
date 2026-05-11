'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime, PAYMENT_METHODS } from '@/lib/utils'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'

interface Sale {
  id: string
  customerName: string | null
  total: number
  paymentMethod: string
  notes: string | null
  createdAt: string
  user: { name: string }
  items: {
    id: string
    quantity: number
    price: number
    product: { name: string }
    variant: { size: string; color: string }
  }[]
}

interface SalesTableProps {
  sales: Sale[]
  dateFrom?: string
  dateTo?: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}

const paymentVariant: Record<string, 'success' | 'default' | 'secondary'> = {
  cash: 'success',
  card: 'default',
  transfer: 'secondary',
}

export function SalesTable({
  sales,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: SalesTableProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = sales.filter((s) => {
    const matchesSearch =
      (s.customerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      s.items.some((i) => i.product.name.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  const total = filtered.reduce((s, sale) => s + sale.total, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500 whitespace-nowrap">Desde:</span>
          <Input
            type="date"
            value={dateFrom ?? ''}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500 whitespace-nowrap">Hasta:</span>
          <Input
            type="date"
            value={dateTo ?? ''}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{filtered.length} ventas encontradas</span>
        <span className="font-semibold text-gray-900">
          Total: {formatCurrency(total)}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8"></TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Método de pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Vendedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sale) => (
                <>
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                  >
                    <TableCell>
                      {expanded === sale.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(sale.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {sale.customerName ?? <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                      {sale.items
                        .map((i) => `${i.product.name} (x${i.quantity})`)
                        .join(', ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentVariant[sale.paymentMethod] ?? 'secondary'}>
                        {PAYMENT_METHODS[sale.paymentMethod] ?? sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{sale.user.name}</TableCell>
                  </TableRow>
                  {expanded === sale.id && (
                    <TableRow key={`${sale.id}-detail`} className="bg-gray-50">
                      <TableCell colSpan={7}>
                        <div className="py-2 px-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Detalle de productos:</p>
                          <table className="text-xs w-full">
                            <thead>
                              <tr className="text-left text-gray-400">
                                <th className="pb-1 font-medium">Producto</th>
                                <th className="pb-1 font-medium">Talle/Color</th>
                                <th className="pb-1 font-medium text-center">Cant.</th>
                                <th className="pb-1 font-medium text-right">P. unitario</th>
                                <th className="pb-1 font-medium text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-0.5">{item.product.name}</td>
                                  <td className="py-0.5 text-gray-500">
                                    {item.variant.size} / {item.variant.color}
                                  </td>
                                  <td className="py-0.5 text-center">{item.quantity}</td>
                                  <td className="py-0.5 text-right">{formatCurrency(item.price)}</td>
                                  <td className="py-0.5 text-right font-medium">
                                    {formatCurrency(item.price * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {sale.notes && (
                            <p className="mt-2 text-xs text-gray-500">
                              <span className="font-medium">Nota:</span> {sale.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
