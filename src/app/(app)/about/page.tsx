'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'

export default function AboutPage() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  const gitCommit = process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown'
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE

  const formattedBuildDate = buildDate
    ? format(new Date(buildDate), 'PPpp')
    : 'unknown'

  const githubCommitUrl =
    gitCommit !== 'unknown'
      ? `https://github.com/your-org/snakey/commit/${gitCommit}`
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">About</h1>
        <p className="text-warm-700 dark:text-warm-300">Application information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snakey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-warm-700 dark:text-warm-300">
            A Progressive Web App for reptile care tracking. Track feedings,
            sheds, weights, breeding events, and more for your reptile
            collection.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-warm-700 dark:text-warm-400">Version</dt>
              <dd className="text-warm-900 dark:text-warm-100">{version}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-warm-700 dark:text-warm-400">Git Commit</dt>
              <dd className="text-warm-900 dark:text-warm-100">
                {githubCommitUrl ? (
                  <a
                    href={githubCommitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <code>{gitCommit}</code>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                ) : (
                  <code>{gitCommit}</code>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-warm-700 dark:text-warm-400">Build Date</dt>
              <dd className="text-warm-900 dark:text-warm-100">{formattedBuildDate}</dd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
