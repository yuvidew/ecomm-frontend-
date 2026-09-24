# Phase 1 — Authentication

## Context

The backend's auth API (sign-up, sign-in, refresh-token, logout) is done. This phase wires
the frontend up to it: sign-in/sign-up forms, an in-memory session, automatic access-token
refresh, and a logout flow that also fires when the refresh token has expired (the user's
original ask). Infra (Tailwind, shadcn, TanStack Query, router, axios client) is **already
installed and configured** in this repo — contrary to CLAUDE.md §7, which is stale — so this
phase goes straight to feature work under `src/features/auth/`.

### Known backend issues (do not fix — backend is read-only for this project)

- `generateRefreshToken` is signed with the wrong secret (uses the expiry-string config value
  instead of the refresh secret), so `POST /api/auth/refresh-token` will 401 even immediately
  after a fresh sign-in. The frontend is built to the *intended* contract; refreshing a
  session won't actually work until this is fixed backend-side. Flagged to the user already.
- Sign-in's 401 body currently comes back as `{ message: "Internal Server Error" }` instead
  of "Invalid email or password" (typo bug: `messsge` vs `message` in the backend). Frontend
  works around this with a hardcoded fallback message (decision below).
- `revoke_at` vs `revoked_at` column mismatch likely breaks server-side revocation on
  logout/rotation — not user-facing, no frontend workaround needed.
- `role` is unrestricted free text server-side; frontend hardcodes `"customer"` and exposes
  no role picker (this storefront is customer-facing only, per user decision).

### Decisions locked in with the user

1. Session-expiry UX: clear session + redirect to `/sign-in` (with a toast), not a modal.
2. Refresh strategy: reactive only — one bootstrap `refresh-token` call on app load, then an
   axios response interceptor refreshes+retries on a 401 from any other call. No timers.
3. Sign-in error text: hardcode "Invalid email or password" on 401, ignore the buggy backend
   message.
4. No role picker; sign-up/sign-in always send `role: "customer"`.
5. Access token lives in memory only (never localStorage/sessionStorage) — lost on hard
   refresh, restored via the bootstrap refresh call.

## Auth state: TanStack Query is the source of truth

No separate store/Context. `["auth", "session"]` in the existing shared `queryClient`
(`src/lib/query-client.ts`) holds `AuthSession | null`. Its `queryFn` *is* the one-time
bootstrap `refresh-token` call — `staleTime: Infinity`, `retry: false`, so Query never
silently refetches it (would spam `refresh-token`). Both the axios interceptor (non-React,
via `queryClient.getQueryData`/`setQueryData` directly) and components (via `useSession()` →
`useQuery`) read/write the same cache entry.

```ts
// src/types/auth.ts — app-wide, used by lib/http.ts and generic components, not feature-scoped
export type AuthUser = { id: number; email: string; role: string }
export type AuthSession = { accessToken: string; user: AuthUser }
```

```ts
// src/lib/query-keys.ts
export const authKeys = { session: ["auth", "session"] as const }
```

```ts
// src/lib/jwt.ts
// decodeAccessToken — reads the JWT payload (base64url) client-side, no signature
// verification (that's the backend's job); returns null on malformed input. Needed because
// sign-in's response only contains the accessToken, not a user object.
export const decodeAccessToken = (token: string): AuthUser | null => { ... }
```

## `src/lib/http.ts` — interceptors

Add to the existing axios instance, no new dependency:

- **Request interceptor**: reads `queryClient.getQueryData(authKeys.session)?.accessToken`,
  attaches `Authorization: Bearer <token>` if present.
- **Response interceptor**: on a 401 from a non-auth endpoint (`/auth/sign-in`,
  `/auth/sign-up`, `/auth/refresh-token`, `/auth/logout` are excluded, to avoid infinite
  loops / false "session expired" toasts on the bootstrap call itself) that hasn't already
  been retried, call a deduped `refreshAccessToken()` (a shared in-flight promise so
  concurrent 401s trigger one refresh, not N), retry the original request once with the new
  token. If refresh fails: `setQueryData(authKeys.session, null)`, toast "Session expired,
  please sign in again" (shadcn `sonner`), then **`window.location.assign('/sign-in')`** — a
  hard redirect, not `router.navigate`, specifically to avoid a circular import
  (`http.ts → app/router.tsx → pages → features/auth → http.ts`) and because a full reload is
  consistent with the in-memory-only token model.
- Add `getApiErrorMessage(error, fallback)` here too — normalizes an axios error into a
  display string, used by the forms.

## `src/features/auth/` files

| File | Responsibility |
|---|---|
| `api/auth.ts` | `signUp`, `signIn`, `refreshSession`, `logout` — plain axios calls via `http`. `signUp`/`signIn` inject `role: "customer"`. `signIn` catches a 401 and rethrows `new Error("Invalid email or password")`. `refreshSession` never throws — resolves `null` on any failure ("no session" isn't an error). |
| `hooks/use-session.ts` | `useSession()` — `useQuery({ queryKey: authKeys.session, queryFn: refreshSession, staleTime: Infinity, retry: false, refetchOnWindowFocus: false, refetchOnMount: false })`. This one query is both the app-load bootstrap and the reactive session read. Returns `{ session, isLoading }`. |
| `hooks/use-sign-in.ts` | `useSignIn()` — mutation wrapping `signIn`; `onSuccess` decodes the token, `queryClient.setQueryData(authKeys.session, session)`. |
| `hooks/use-sign-up.ts` | `useSignUp()` — mutation wrapping `signUp`. No cache write (no tokens returned/no auto-login per backend contract) — caller handles success (toast + redirect to sign-in). |
| `hooks/use-logout.ts` | `useLogout()` — mutation wrapping `logout`; `onSettled` (not `onSuccess` — end the local session even if the network call fails) clears the session cache to `null` and navigates to `/sign-in`. |
| `_components/sign-in-form.tsx` | Controlled email/password inputs using existing `Field`/`Input`/`Label` primitives (no RHF/zod — see below). Calls `useSignIn`; single top-level error via `getApiErrorMessage`; disables submit + shows `Spinner` while pending. |
| `_components/sign-up-form.tsx` | Controlled name/email/password inputs. Calls `useSignUp`; on 400 renders per-field errors from `error.response.data.errors` (backend's zod fieldErrors shape); on 409 shows "Email already registered"; on success, toast + navigate to `/sign-in`. |
| `types/auth.ts` | Wire DTOs only: `SignUpInput`, `SignUpRequest`, `SignUpResponse`, `SignInInput`, `SignInRequest`, `SignInResponse`, `RefreshTokenResponse`, `LogoutResponse`. (`AuthUser`/`AuthSession` stay in the app-wide `src/types/auth.ts`.) |

No new npm dependencies. Existing shadcn primitives (`input`, `label`, `button`, `card`,
`field`, `spinner`, `sonner`) fully cover both forms — skip adding `form.tsx` +
react-hook-form + zod this phase; the backend already returns ready-to-render field errors
and two 2–4 field forms don't need a form library yet.

## Route protection, pages, nav

- `src/components/require-auth.tsx` — generic (not auth-feature UI, so it lives in the global
  `src/components/`), gates future routes: reads `useSession()`, shows a full-page `Spinner`
  while loading, `<Navigate to="/sign-in" replace state={{ from: location }} />` if no
  session, else renders children. Not wired to any route yet this phase (no protected feature
  routes exist) — built now since it's needed the moment cart/checkout land.
- `src/pages/sign-in-page.tsx`, `src/pages/sign-up-page.tsx` — render the forms + a link to
  the other page.
- `src/components/nav-bar.tsx` — reads `useSession()`; shows sign-in/sign-up links when
  logged out, or the user's email + a logout button when logged in. Added this phase (beyond
  the minimum) because without it there's no way to exercise the sign-in → session → logout
  loop end-to-end in the browser.
- `src/app/root-layout.tsx` — `<NavBar /><Outlet /></>`, so the nav persists across routes.
- `src/app/router.tsx` — restructure to a layout route:
  ```tsx
  export const router = createBrowserRouter([
    {
      element: <RootLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/sign-in', element: <SignInPage /> },
        { path: '/sign-up', element: <SignUpPage /> },
      ],
    },
  ])
  ```

## Session bootstrap on app load

`src/app/session-bootstrap.tsx` — blocks rendering of the app tree until `useSession()`'s
initial load resolves (shows a centered `Spinner`), avoiding a flash of logged-out UI.

```tsx
const SessionBootstrap = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useSession()
  if (isLoading) return <Spinner />
  return children
}
```

Wired inside `src/app/providers.tsx`, **inside** `QueryClientProvider` (it calls a hook):

```tsx
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <SessionBootstrap>{children}</SessionBootstrap>
    <Toaster />
  </QueryClientProvider>
)
```

`<Toaster />` (shadcn `sonner`) isn't mounted anywhere yet — this phase mounts it once here,
needed for the session-expiry and sign-up-success toasts.

## Sequencing

1. `src/types/auth.ts`, `src/lib/jwt.ts`, `src/lib/query-keys.ts`
2. `src/lib/http.ts` interceptors + `getApiErrorMessage`
3. `src/features/auth/types/auth.ts`, `src/features/auth/api/auth.ts`
4. `src/features/auth/hooks/{use-session,use-sign-in,use-sign-up,use-logout}.ts`
5. `src/app/session-bootstrap.tsx`; update `src/app/providers.tsx`
6. `src/components/require-auth.tsx`
7. `src/features/auth/_components/{sign-in-form,sign-up-form}.tsx`
8. `src/pages/{sign-in-page,sign-up-page}.tsx`
9. `src/components/nav-bar.tsx`, `src/app/root-layout.tsx`
10. `src/app/router.tsx` restructure

## Out of scope for this phase

- Fixing the backend refresh-token signing bug, the `revoke_at`/`revoked_at` mismatch, or the
  sign-in error-message typo (backend is read-only for this project).
- Wiring `RequireAuth` to any actual protected route (no protected feature exists yet).
- react-hook-form/zod client-side validation.
- Role selection UI.

## Verification

1. `npm run dev`, confirm the app still boots (session bootstrap resolves to `null`
   quickly since no cookie exists yet).
2. Sign up a new user via `/sign-up` → expect redirect/toast, no auto-login (per backend
   contract).
3. Sign in via `/sign-in` → nav bar should switch to the logged-in state; DevTools Network
   tab should show `Authorization: Bearer ...` on any subsequent authenticated call.
4. Click logout → nav reverts to logged-out state, `POST /api/auth/logout` fires.
5. Confirm a hard page refresh drops the session (expected: in-memory token + the known
   backend refresh-token bug mean the bootstrap `refresh-token` call currently always fails).
6. Trigger a 401 on a protected call (once one exists) and confirm the interceptor attempts
   one refresh+retry before giving up — until the backend bug is fixed, this will surface as
   the "session expired" toast + redirect, which is the correct frontend behavior for a
   genuinely failed refresh.
7. `npm run lint` and `tsc -b` (via `npm run build`) clean.
