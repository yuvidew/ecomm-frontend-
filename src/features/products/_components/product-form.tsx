import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/http'
import { useCreateProduct } from '../hooks/use-create-product'
import { useUpdateProduct } from '../hooks/use-update-product'
import type { Product, ProductFieldName, ProductInput } from '../types/products'
import { ImageUploader } from './image-uploader'

/**
 * ProductForm — create/edit form for a product. Without `product` it creates
 * a new one; with `product` it's prefilled and saves changes. Navigates to
 * the product's detail page on success.
 * @param product - existing product to edit; omit to create
 */
export const ProductForm = ({ product }: { product?: Product }) => {
  const isEdit = product !== undefined
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product ? String(product.category_id) : '')
  const [price, setPrice] = useState(product ? String(Number(product.price)) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [description, setDescription] = useState(product?.description ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [isUploading, setIsUploading] = useState(false)
  const [categoryMissing, setCategoryMissing] = useState(false)

  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const navigate = useNavigate()

  const { isPending, isError, error } = isEdit ? updateMutation : createMutation
  const fieldErrors = getApiFieldErrors<ProductFieldName>(error)

  // renders a backend zod error list under a field
  const errorsFor = (field: ProductFieldName) => fieldErrors?.[field]?.map((message) => ({ message }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Radix Select can't be `required`, so validate it here
    if (!categoryId) {
      setCategoryMissing(true)
      return
    }
    setCategoryMissing(false)

    const input: ProductInput = {
      categoryId: Number(categoryId),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      // always the full list: the backend replaces every image when `images` is sent
      images,
    }
    const onSuccess = (saved: Product) => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate(`/admin/products/${saved.id}`, { replace: isEdit })
    }

    if (isEdit) {
      updateMutation.mutate({ id: product.id, input }, { onSuccess })
    } else {
      createMutation.mutate(input, { onSuccess })
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Basic info</span>
              <Separator />
            </div>
            <Field data-invalid={!!fieldErrors?.name}>
              <FieldLabel htmlFor="product-name">Name</FieldLabel>
              <Input
                id="product-name"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError errors={errorsFor('name')} />
            </Field>

            <Field data-invalid={categoryMissing || !!fieldErrors?.categoryId}>
              <FieldLabel htmlFor="product-category">Category</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={categoriesLoading}>
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder={categoriesLoading ? 'Loading categories…' : 'Select a category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!categoriesLoading && !categories?.length && (
                <FieldDescription>
                  No categories yet —{' '}
                  <Link to="/admin/categories" className="underline underline-offset-4">
                    create one first
                  </Link>
                  .
                </FieldDescription>
              )}
              {categoryMissing && <FieldError>Select a category.</FieldError>}
              <FieldError errors={errorsFor('categoryId')} />
            </Field>

            <div className="flex flex-col gap-1 pt-2">
              <span className="text-sm font-medium text-foreground">Pricing &amp; inventory</span>
              <Separator />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={!!fieldErrors?.price}>
                <FieldLabel htmlFor="product-price">Price</FieldLabel>
                <Input
                  id="product-price"
                  type="number"
                  inputMode="decimal"
                  required
                  min={0.01}
                  step={0.01}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
                <FieldError errors={errorsFor('price')} />
              </Field>
              <Field data-invalid={!!fieldErrors?.stock}>
                <FieldLabel htmlFor="product-stock">Stock</FieldLabel>
                <Input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  required
                  min={0}
                  step={1}
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                />
                <FieldError errors={errorsFor('stock')} />
              </Field>
            </div>

            <div className="flex flex-col gap-1 pt-2">
              <span className="text-sm font-medium text-foreground">Media</span>
              <Separator />
            </div>
            <Field data-invalid={!!fieldErrors?.images}>
              <FieldLabel htmlFor="product-images">Images</FieldLabel>
              <ImageUploader
                id="product-images"
                value={images}
                onChange={setImages}
                onUploadingChange={setIsUploading}
              />
              <FieldError errors={errorsFor('images')} />
            </Field>

            <div className="flex flex-col gap-1 pt-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <Separator />
            </div>
            <Field data-invalid={!!fieldErrors?.description}>
              <FieldLabel htmlFor="product-description">Details</FieldLabel>
              <Textarea
                id="product-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <FieldError errors={errorsFor('description')} />
            </Field>

            {isError && !fieldErrors && <FieldError>{getApiErrorMessage(error)}</FieldError>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending && <Spinner />}
                {isEdit ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
