import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * QueryErrorAlert — consistent destructive alert for a failed query/mutation.
 * Reused everywhere an admin surface currently shows plain destructive text.
 * @param message - the error message to display (usually from `getApiErrorMessage`)
 * @param title - heading above the message (defaults to "Something went wrong")
 */
export const QueryErrorAlert = ({
  message,
  title = 'Something went wrong',
}: {
  message: string
  title?: string
}) => {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
