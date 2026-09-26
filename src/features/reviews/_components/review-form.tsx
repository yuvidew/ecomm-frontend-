import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/http'
import { useCreateReview } from '../hooks/use-create-review'
import { useUpdateReview } from '../hooks/use-update-review'
import type { Review } from '../types/reviews'

/**
 * ReviewForm — create/edit form for one product review. Without
 * `existingReview` it submits a new review; with it, it's prefilled and
 * saves an edit.
 * @param productId - product being reviewed
 * @param existingReview - the signed-in user's own review to edit; omit to create
 * @param onDone - called after a successful submit, or when Cancel is clicked
 */
export const ReviewForm = ({
  productId,
  existingReview,
  onDone,
}: {
  productId: number
  existingReview?: Review
  onDone?: () => void
}) => {
  const isEdit = existingReview !== undefined
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')

  const createMutation = useCreateReview()
  const updateMutation = useUpdateReview()
  const { isPending, isError, error } = isEdit ? updateMutation : createMutation

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating < 1) return

    const handleSaved = () => {
      toast.success(isEdit ? 'Review updated' : 'Review submitted')
      onDone?.()
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: existingReview.id, productId, input: { rating, comment: comment.trim() || undefined } },
        { onSuccess: handleSaved },
      )
    } else {
      createMutation.mutate(
        { productId, rating, comment: comment.trim() || undefined },
        { onSuccess: handleSaved },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your rating</span>
        <StarRating value={rating} onChange={setRating} size="size-6" />
      </div>
      <Textarea
        placeholder="Share your thoughts about this product (optional)"
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {isError && <FieldError>{getApiErrorMessage(error)}</FieldError>}
      <div className="flex justify-end gap-2">
        {isEdit && (
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || rating < 1}>
          {isPending && <Spinner />}
          {isEdit ? 'Save changes' : 'Submit review'}
        </Button>
      </div>
    </form>
  )
}
