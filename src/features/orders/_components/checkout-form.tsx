import { ShoppingBagIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/features/cart/hooks/use-cart'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { usePlaceOrder } from '../hooks/use-place-order'

/**
 * CheckoutForm — order summary drawn from the current cart, a shipping
 * address field, and a "Place order" action that converts the cart into
 * an order (POST /api/orders) and redirects to the payment page on success.
 */
export const CheckoutForm = () => {
  const { data: cart, isLoading: isCartLoading } = useCart()
  const [shippingAddress, setShippingAddress] = useState('')
  const { mutate, isPending, isError, error } = usePlaceOrder()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutate(
      { shippingAddress: shippingAddress.trim() },
      {
        onSuccess: (order) => {
          toast.success('Order placed')
          navigate(`/orders/${order.id}/pay`)
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Could not place order')),
      },
    )
  }

  if (isCartLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (!cart?.items.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingBagIcon />
          </EmptyMedia>
          <EmptyTitle>Your cart is empty</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="line-clamp-1">
                {item.name} <span className="text-muted-foreground">&times; {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatPrice(Number(item.price) * item.quantity)}
              </span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-base font-semibold tabular-nums">{formatPrice(cart.total)}</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={isError}>
            <FieldLabel htmlFor="shipping-address">Shipping address</FieldLabel>
            <Textarea
              id="shipping-address"
              required
              minLength={5}
              autoFocus
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
              placeholder="Street, city, state, postal code"
            />
            {isError && <FieldError>{getApiErrorMessage(error)}</FieldError>}
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Place order
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
