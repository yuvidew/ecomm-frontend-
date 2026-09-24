import { SignInForm } from '@/features/auth/_components/sign-in-form'

/**
 * SignInPage — route ("/sign-in") for signing in to an existing account.
 */
const SignInPage = () => {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <SignInForm />
    </main>
  )
}

export default SignInPage
