import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/Typography'

/** Página provisória enquanto a funcionalidade não é implementada. */
export function PlaceholderPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle>{title}</PageTitle>
      <EmptyState>{message}</EmptyState>
    </div>
  )
}
