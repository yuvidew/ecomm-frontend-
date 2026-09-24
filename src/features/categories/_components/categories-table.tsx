import { useState } from 'react'
import { SearchIcon, TagsIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { CreateCategoryDialog } from './create-category-dialog'
import { useCategories } from '../hooks/use-categories'

/**
 * CategoriesTable — lists every category (name, slug, created date), with
 * loading, error, empty, and client-side name-filtered states.
 */
export const CategoriesTable = () => {
  const { data: categories, isLoading, isError, error } = useCategories()
  const [filter, setFilter] = useState('')

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (isError) {
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load categories')} />
  }

  if (!categories?.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TagsIcon />
          </EmptyMedia>
          <EmptyTitle>No categories yet</EmptyTitle>
          <EmptyDescription>Create a category before adding products.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateCategoryDialog />
        </EmptyContent>
      </Empty>
    )
  }

  const visible = categories.filter((category) => category.name.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <SearchIcon aria-hidden="true" className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by name…"
          autoComplete="off"
          className="pl-8"
          aria-label="Filter categories by name"
        />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((category) => (
              <TableRow key={category.id} className="hover:bg-muted/50">
                <TableCell className="max-w-64 truncate font-medium">{category.name}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">{category.slug}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(category.created_at)}</TableCell>
              </TableRow>
            ))}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No categories match “{filter}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
