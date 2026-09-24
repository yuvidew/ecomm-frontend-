import { useState, type FormEvent } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/http'
import { useCreateCategory } from '../hooks/use-create-category'

/**
 * CreateCategoryDialog — "New category" button that opens a dialog with a
 * name field and creates the category on submit.
 */
export const CreateCategoryDialog = () => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const { mutate, isPending, isError, error, reset } = useCreateCategory()

  const fieldErrors = getApiFieldErrors<'name'>(error)

  // clear the form and any previous error whenever the dialog opens or closes
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    setName('')
    reset()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutate(
      { name: name.trim() },
      {
        onSuccess: (category) => {
          toast.success(`Category "${category.name}" created`)
          handleOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          New category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>Products are grouped by category in the store.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!fieldErrors?.name}>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                required
                minLength={2}
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError errors={fieldErrors?.name?.map((message) => ({ message }))} />
            </Field>
            {isError && !fieldErrors && <FieldError>{getApiErrorMessage(error)}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
