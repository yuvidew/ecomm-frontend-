import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage } from '@/lib/http'
import { useVerifyPayment } from '../hooks/use-verify-payment'

/**
 * PaymentSimulator — since the backend has no real gateway, this stands in
 * for the gateway callback: "Simulate Success"/"Simulate Failure" both call
 * POST /api/payments/:transactionRef/verify with the matching `simulate` value.
 * @param transactionRef - transaction ref of the in-flight ("initiated") payment attempt
 */
export const PaymentSimulator = ({ transactionRef }: { transactionRef: string }) => {
  const { mutate, isPending } = useVerifyPayment()

  const simulate = (outcome: 'success' | 'failure') => {
    mutate(
      { transactionRef, simulate: outcome },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not verify payment')) },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        This project uses a mocked payment gateway — choose an outcome to simulate the provider's callback.
      </p>
      <div className="flex gap-2">
        <Button disabled={isPending} onClick={() => simulate('success')}>
          {isPending && <Spinner />}
          Simulate Success
        </Button>
        <Button variant="destructive" disabled={isPending} onClick={() => simulate('failure')}>
          {isPending && <Spinner />}
          Simulate Failure
        </Button>
      </div>
    </div>
  )
}
