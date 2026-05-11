'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface TopProductsChartProps {
  data: { name: string; total: number; quantity: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-blue-600">
          Total: {formatCurrency(payload[0]?.value ?? 0)}
        </p>
        <p className="text-sm text-gray-500">
          Unidades: {payload[0]?.payload?.quantity}
        </p>
      </div>
    )
  }
  return null
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
