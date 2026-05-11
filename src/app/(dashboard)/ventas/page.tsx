'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { SalesTable } from '@/components/sales/SalesTable'
import { SaleForm } from '@/components/sales/SaleForm'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Plus, DollarSign, ShoppingCart, CreditCard, Banknote } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface Product {
  id: string
  name: string
  variants: {
    id: string
    size: string
    color: string
    quantity: number
    price: number
  }[]
}

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchSales = async () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    try {
      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()
      setSales(data)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
  }

  useEffect(() => {
    fetchSales()
    fetchProducts()
  }, [dateFrom, dateTo])

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const cashSales = sales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((s, sale) => s + sale.total, 0)
  const cardSales = sales
    .filter((s) => s.paymentMethod === 'card')
    .reduce((s, sale) => s + sale.total, 0)
  const transferSales = sales
    .filter((s) => s.paymentMethod === 'transfer')
    .reduce((s, sale) => s + sale.total, 0)

  return (
    <div>
      <Header title="Ventas" />
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historial de ventas</h2>
            <p className="text-sm text-gray-500">{sales.length} ventas registradas</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nueva venta
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total en ventas"
            value={formatCurrency(totalRevenue)}
            subtitle={`${sales.length} transacciones`}
            icon={DollarSign}
            color="blue"
          />
          <StatsCard
            title="Efectivo"
            value={formatCurrency(cashSales)}
            subtitle={`${sales.filter((s) => s.paymentMethod === 'cash').length} ventas`}
            icon={Banknote}
            color="green"
          />
          <StatsCard
            title="Tarjeta"
            value={formatCurrency(cardSales)}
            subtitle={`${sales.filter((s) => s.paymentMethod === 'card').length} ventas`}
            icon={CreditCard}
            color="purple"
          />
          <StatsCard
            title="Transferencia"
            value={formatCurrency(transferSales)}
            subtitle={`${sales.filter((s) => s.paymentMethod === 'transfer').length} ventas`}
            icon={ShoppingCart}
            color="orange"
          />
        </div>

        {/* Sales table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <SalesTable
            sales={sales}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        )}
      </div>

      <SaleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchSales}
        products={products}
      />
    </div>
  )
}
