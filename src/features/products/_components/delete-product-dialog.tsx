import { useNavigate } from 'react-router'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage } from '@/lib/http'
import { useDeleteProduct } from '../hooks/use-delete-product'
import type { Product } from '../types/products'

/**
 * DeleteProductDialog — "Delete" button with a confirmation dialog; deletes
 * the product and returns to the product grid on success.
 * @param product - the product to delete
 */
export const DeleteProductDialog = ({ product }: { product: Pick<Product, 'id' | 'name'> }) => {
  const { mutate, isPending } = useDeleteProduct()
  const navigate = useNavigate()

  const handleDelete = () => {
    mutate(product.id, {
      onSuccess: () => {
        toast.success(`"${product.name}" deleted`)
        navigate('/admin', { replace: true })
      },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete product')),
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2Icon />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{product.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the product from the store. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // keep the dialog open until the request settles
              event.preventDefault()
              handleDelete()
            }}
          >
            {isPending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
