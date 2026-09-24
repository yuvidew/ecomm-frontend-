import { SignUpForm } from '@/features/auth/_components/sign-up-form'

/**
 * SignUpPage — route ("/sign-up") for creating a new account.
 */
const SignUpPage = () => {
  return (
    <main id="main-content" className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <SignUpForm />
    </main>
  )
}

export default SignUpPage
