import { CreditCardIcon, SmartphoneIcon, WalletIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage } from '@/lib/http'
import { useInitiatePayment } from '../hooks/use-initiate-payment'
import type { PaymentMethod } from '../types/payments'

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: typeof CreditCardIcon }[] = [
  { value: 'card', label: 'Card', icon: CreditCardIcon },
  { value: 'upi', label: 'UPI', icon: SmartphoneIcon },
  { value: 'wallet', label: 'Wallet', icon: WalletIcon },
]

/**
 * PaymentMethodForm — method picker + submit that starts a payment attempt
 * (POST /api/payments/) for an order.
 * @param orderId - order to initiate a payment for
 * @param retry - true to label this as a retry after a failed attempt
 */
export const PaymentMethodForm = ({ orderId, retry = false }: { orderId: number; retry?: boolean }) => {
  const [method, setMethod] = useState<PaymentMethod>('card')
  const { mutate, isPending } = useInitiatePayment()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutate(
      { orderId, method },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not start payment')) },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <RadioGroup value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
          {METHOD_OPTIONS.map(({ value, label, icon: Icon }) => (
            <FieldLabel key={value} htmlFor={`payment-method-${value}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <Icon className="size-4" />
                    {label}
                  </FieldTitle>
                </FieldContent>
                <RadioGroupItem value={value} id={`payment-method-${value}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            {retry ? 'Retry payment' : 'Pay now'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
