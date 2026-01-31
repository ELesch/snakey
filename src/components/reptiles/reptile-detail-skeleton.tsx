import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ReptileDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-warm-200 rounded animate-pulse" />
        <div>
          <div className="h-7 w-48 bg-warm-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-32 bg-warm-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 w-96 bg-warm-200 rounded animate-pulse" />

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-warm-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 w-24 bg-warm-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-warm-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
