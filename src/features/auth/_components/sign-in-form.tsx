import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { Spinner } from '@/components/ui/spinner'
import { getApiErrorMessage } from '@/lib/http'
import { decodeAccessToken } from '@/lib/jwt'
import { useSignIn } from '../hooks/use-sign-in'

/**
 * SignInForm — collects email/password and signs the user in.
 */
export const SignInForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { mutate, isPending, isError, error } = useSignIn()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutate(
      { email, password },
      {
        // admins land on the dashboard; role comes from the token, the claim the backend authorizes on
        onSuccess: (data) => navigate(decodeAccessToken(data.accessToken)?.role === 'admin' ? '/admin' : '/'),
      },
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                <Input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                <PasswordInput
                  id="sign-in-password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              {isError && <FieldError>{getApiErrorMessage(error)}</FieldError>}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner />}
                  Sign in
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{' '}
                  <Link to="/sign-up" className="underline-offset-4 hover:text-primary hover:underline">
                    Sign up
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
