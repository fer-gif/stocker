import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  trend?: { value: number; label: string }
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-xs text-gray-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
