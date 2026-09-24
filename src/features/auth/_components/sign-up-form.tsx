import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/http'
import { useSignUp } from '../hooks/use-sign-up'

/**
 * SignUpForm — collects name/email/password and creates an account.
 * Sign-up doesn't return tokens (no auto-login), so success sends the user
 * to sign in. Confirm-password is a client-side-only check, never sent to
 * the backend.
 */
export const SignUpForm = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState(false)
  const { mutate, isPending, isError, error } = useSignUp()
  const navigate = useNavigate()

  const fieldErrors = getApiFieldErrors<'name' | 'email' | 'password'>(error)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setConfirmError(true)
      return
    }
    setConfirmError(false)
    mutate(
      { name, email, password },
      {
        onSuccess: () => {
          toast.success('Account created -- sign in to continue')
          navigate('/sign-in')
        },
      },
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sign-up-name">Full Name</FieldLabel>
                <Input
                  id="sign-up-name"
                  autoComplete="name"
                  minLength={2}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <FieldError errors={fieldErrors?.name?.map((message) => ({ message }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                <Input
                  id="sign-up-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldError errors={fieldErrors?.email?.map((message) => ({ message }))} />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                    <PasswordInput
                      id="sign-up-password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sign-up-confirm-password">Confirm Password</FieldLabel>
                    <PasswordInput
                      id="sign-up-confirm-password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </Field>
                </Field>
                {confirmError ? (
                  <FieldError>Passwords don&apos;t match.</FieldError>
                ) : (
                  <FieldError errors={fieldErrors?.password?.map((message) => ({ message }))} />
                )}
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              </Field>
              {isError && !fieldErrors && <FieldError>{getApiErrorMessage(error)}</FieldError>}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner />}
                  Create Account
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{' '}
                  <Link to="/sign-in" className="underline-offset-4 hover:text-primary hover:underline">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our Terms of Service and Privacy Policy.
      </FieldDescription>
    </div>
  )
}
