import { Card, CardContent } from '@/components/ui/card'

export function ReptileGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-0">
            <div className="aspect-square bg-warm-200 rounded-t-lg animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-24 bg-warm-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-warm-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
