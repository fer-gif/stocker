'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { TopProductsChart } from '@/components/dashboard/TopProductsChart'
import { RecentSales } from '@/components/dashboard/RecentSales'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'
import { MarginChart } from '@/components/dashboard/MarginChart'
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  salesToday: number
  salesTodayCount: number
  salesWeek: number
  salesWeekCount: number
  salesMonth: number
  salesMonthCount: number
  expensesMonth: number
  totalProducts: number
  lowStockCount: number
  lowStockItems: {
    id: string
    productName: string
    size: string
    color: string
    quantity: number
  }[]
  salesChartData: { date: string; total: number; count: number }[]
  topProducts: { name: string; total: number; quantity: number }[]
  recentSales: any[]
  marginByProduct: { name: string; marginPct: number; marginAbs: number }[]
  bestMarginProduct: { name: string; marginPct: number; marginAbs: number } | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Ventas hoy"
            value={loading ? '...' : formatCurrency(stats?.salesToday ?? 0)}
            subtitle={`${stats?.salesTodayCount ?? 0} transacciones`}
            icon={DollarSign}
            color="blue"
          />
          <StatsCard
            title="Ventas esta semana"
            value={loading ? '...' : formatCurrency(stats?.salesWeek ?? 0)}
            subtitle={`${stats?.salesWeekCount ?? 0} transacciones`}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Ventas este mes"
            value={loading ? '...' : formatCurrency(stats?.salesMonth ?? 0)}
            subtitle={`${stats?.salesMonthCount ?? 0} transacciones`}
            icon={ShoppingCart}
            color="purple"
          />
          <StatsCard
            title="Gastos del mes"
            value={loading ? '...' : formatCurrency(stats?.expensesMonth ?? 0)}
            icon={Receipt}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total productos"
            value={loading ? '...' : String(stats?.totalProducts ?? 0)}
            subtitle="productos en catálogo"
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Alertas de stock"
            value={loading ? '...' : String(stats?.lowStockCount ?? 0)}
            subtitle="variantes con stock bajo"
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Mejor margen"
            value={loading ? '...' : stats?.bestMarginProduct ? `${stats.bestMarginProduct.marginPct}%` : '-'}
            subtitle={stats?.bestMarginProduct ? stats.bestMarginProduct.name : 'Sin datos'}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart data={stats?.salesChartData ?? []} />
          <TopProductsChart data={stats?.topProducts ?? []} />
        </div>

        {/* Margin analysis */}
        <MarginChart data={stats?.marginByProduct ?? []} />

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSales sales={stats?.recentSales ?? []} />
          <LowStockAlert items={stats?.lowStockItems ?? []} />
        </div>
      </div>
    </div>
  )
}
