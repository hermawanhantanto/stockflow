import { AlertTriangle, CheckCircle2, Package, TrendingUp } from 'lucide-react'
import { formatRupiah } from '@/features/products/utils/format'
import { cn } from '@/lib/utils'
import { useDashboardSummary } from '../hooks/use-dashboard-summary'

export function SummaryCards() {
  const {
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalStockValue,
    lowStockCount,
    totalUnits,
    isLoading,
  } = useDashboardSummary()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="size-8 bg-muted rounded-lg" />
            </div>
            <div className="h-7 w-32 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts.toLocaleString('id-ID'),
      subtitle: `${totalUnits.toLocaleString('id-ID')} total units in warehouse`,
      icon: Package,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      borderAccent: '',
    },
    {
      title: 'Active Products',
      value: activeProducts.toLocaleString('id-ID'),
      subtitle: `${inactiveProducts} inactive item${inactiveProducts !== 1 ? 's' : ''}`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      borderAccent: '',
    },
    {
      title: 'Total Stock Value',
      value: formatRupiah(totalStockValue),
      subtitle: 'Combined inventory asset value',
      icon: TrendingUp,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      borderAccent: '',
    },
    {
      title: 'Low-Stock Items',
      value: lowStockCount.toLocaleString('id-ID'),
      subtitle: 'Items with ≤ 5 units in stock',
      icon: AlertTriangle,
      iconColor: lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
      iconBg: lowStockCount > 0 ? 'bg-amber-500/10' : 'bg-muted',
      borderAccent: lowStockCount > 0 ? 'border-amber-500/30 bg-amber-500/[0.02]' : '',
      valueColor: lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.title}
            className={cn(
              'rounded-xl border bg-card p-5 shadow-xs transition-all hover:shadow-sm space-y-3',
              card.borderAccent
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className={cn('flex size-8 items-center justify-center rounded-lg', card.iconBg)}>
                <Icon className={cn('size-4', card.iconColor)} />
              </div>
            </div>

            <div>
              <p
                className={cn(
                  'text-2xl sm:text-3xl font-bold tracking-tight text-foreground',
                  card.valueColor
                )}
              >
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
