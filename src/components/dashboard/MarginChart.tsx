'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MarginItem {
  name: string
  marginPct: number
  marginAbs: number
}

interface MarginChartProps {
  data: MarginItem[]
}

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md text-sm">
      <p className="font-semibold text-gray-900">{d.name}</p>
      <p className="text-emerald-600">Margen: {d.marginPct}%</p>
      <p className="text-gray-500">
        Promedio por unidad: {formatCurrency(d.marginAbs)}
      </p>
    </div>
  )
}

export function MarginChart({ data }: MarginChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Margen por producto
        </CardTitle>
        <p className="text-xs text-gray-400">Margen promedio sobre precio de venta</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Sin datos de margen
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="marginPct" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
