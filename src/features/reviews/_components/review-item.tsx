import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { StarRating } from '@/components/star-rating'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'
import { formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useDeleteReview } from '../hooks/use-delete-review'
import type { Review } from '../types/reviews'
import { ReviewForm } from './review-form'

/**
 * ReviewItem — one review: reviewer avatar/name, star rating, comment, and
 * date. Shows Edit/Delete controls only when the signed-in user owns it.
 * @param review - the review to render
 * @param productId - the product this review belongs to (for cache invalidation)
 */
export const ReviewItem = ({ review, productId }: { review: Review; productId: number }) => {
  const { session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const deleteMutation = useDeleteReview()
  const isOwner = session?.user.id === review.user_id

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: review.id, productId },
      {
        onSuccess: () => toast.success('Review deleted'),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete review')),
      },
    )
  }

  if (isEditing) {
    return <ReviewForm productId={productId} existingReview={review} onDone={() => setIsEditing(false)} />
  }

  return (
    <div className="flex flex-col gap-3 border-b py-6 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{review.name?.charAt(0).toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{review.name ?? 'Anonymous'}</span>
            <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Edit review" onClick={() => setIsEditing(true)}>
              <PencilIcon className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete review">
                  <Trash2Icon className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                  <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={(event) => {
                      event.preventDefault()
                      handleDelete()
                    }}
                  >
                    {deleteMutation.isPending && <Spinner />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <StarRating value={review.rating} />
      {review.comment && <p className="leading-relaxed text-muted-foreground">{review.comment}</p>}
    </div>
  )
}
