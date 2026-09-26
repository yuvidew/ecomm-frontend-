import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Product } from '../types/products'
import { ProductForm } from './product-form'

/**
 * ProductFormDialog — opens the product create/edit form in a dialog and
 * closes it after a successful save or on cancel.
 * @param product - existing product to edit; omit to create a new one
 * @param trigger - element that opens the dialog (rendered via `asChild`)
 */
export const ProductFormDialog = ({ product, trigger }: { product?: Product; trigger: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const isEdit = product !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update the details for “${product.name}”.` : 'Add a new product to the store.'}
          </DialogDescription>
        </DialogHeader>
        {/* Radix unmounts closed content, so every opening starts from fresh form state */}
        <ProductForm product={product} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
