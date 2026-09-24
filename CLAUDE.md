# CLAUDE.md — e-comm frontend

Instructions for Claude Code when working in this repo. This is the **frontend** for an
e-commerce application, built with Vite + React + TypeScript.

The backend lives in a separate folder and is **read-only** from this project (see
[Backend / API rules](#backend--api-rules)).

---

## 1. Workflow — plan before you build

The user drives work by describing a completed/pending backend feature, e.g. *"I completed
the authentication api"*. On a message like that:

1. **Read the backend** (see below) to learn the real endpoints, payloads, and responses for
   that feature. Do not guess a payload shape — if anything is ambiguous (extra required
   field, response envelope, error format, cookie behavior, etc.), **ask the user** instead
   of assuming.
2. **Write a plan first.** Save it to `.claude/plan/phase-<number>-<phase-name>.md` before
   writing any component/hook/api code. Number phases sequentially in the order they're
   approved (`phase-1-authentication.md`, `phase-2-product-catalog.md`, ...).
3. Only after the plan file exists (and, if the user wants to review it, after they've
   approved it) start implementing that phase.

A plan file should cover:
- Goal / what backend endpoints this phase consumes
- Exact request/response contracts as confirmed with the user (or a list of open questions
  if something's still unclear)
- New feature folder(s), files, routes/pages this phase adds
- Components to build (and which shadcn primitives they're built from)
- TanStack Query hooks/keys this phase introduces
- Out of scope for this phase

Keep each phase scoped to one feature area — don't bundle unrelated features into one plan.

## 2. Backend / API rules

- Backend project path: `D:\learn(backend)\e-comm\backend`
- **Never edit, create, or delete files in the backend folder.** It's a separate project you
  only *read* for API contracts (routes, controllers, services, zod schemas/types).
- Backend stack: Express + TypeScript + MySQL (mysql2), Zod validation, JWT access/refresh
  tokens. Errors come back as `{ message: string }` (or `{ message, errors }` for 400 zod
  validation failures from `validate.middleware.ts`).
- Base URL: `http://localhost:<PORT>` (`PORT` env var, defaults to `5000`). All auth routes
  are mounted at `/api/auth`.
- Auth uses an httpOnly refresh-token cookie (`refreshToken`, scoped to path `/api/auth`) +
  a short-lived access token returned in the JSON body. Any client calling these endpoints
  must send requests with credentials included (`fetch(..., { credentials: "include" })` /
  axios `withCredentials: true`), and CORS on the backend already allows this
  (`cors({ origin: true, credentials: true })`).
- Known auth endpoints today (verify against the backend before building each phase — this
  project evolves; treat this list as a starting point, not a guarantee):
  - `POST /api/auth/sign-up` — body `{ name, email, password, role }` → `201 { message }`
  - `POST /api/auth/sign-in` — body `{ email, password, role }` → `201 { message, accessToken }`, sets refresh cookie
  - `POST /api/auth/refresh-token` — no body (reads cookie) → `200 { accessToken }`, rotates refresh cookie
  - `POST /api/auth/logout` — no body (reads cookie) → `200 { message }`, clears refresh cookie
- If a payload/response shape isn't obvious from reading the backend code, **stop and ask
  the user** rather than inventing fields.

## 3. Coding conventions

- **Arrow functions only** for components, hooks, handlers, and utilities:
  `const MyComponent = () => { ... }`, `const useThing = () => { ... }`,
  `const handleClick = () => { ... }`. No `function` declarations for these.
- **Every component gets a `@param` doc comment** above it describing its props and what it
  renders/does, even if it takes no props:
  ```tsx
  /**
   * ProductCard — displays a single product summary in a grid.
   * @param product - product data returned from GET /api/products
   * @param onAddToCart - called with the product id when "Add to cart" is clicked
   */
  const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
    ...
  };
  ```
- **Comment non-obvious functions/variables**, one short line explaining *what it's for*, not
  a restatement of the code. Skip comments on self-explanatory lines.
- No unused code, no dead scaffolding, no speculative abstractions — build what the current
  phase's plan calls for.
- Prefer TypeScript types/interfaces colocated in each feature's `types/` file over inline
  `any`.

## 4. UI — shadcn/ui + reusable components

- Use **shadcn/ui** for primitives (Button, Input, Dialog, Form, Card, Sheet, Toast/Sonner,
  etc.) — install components via the shadcn CLI, don't hand-roll what shadcn already
  provides.
- Global, generic, reused-across-features UI (buttons, cards, empty states, loaders, layout
  shells, form fields) goes in `src/components/` — build it once, import it everywhere.
  Before adding a new component, check `src/components/` and `src/components/ui/` for
  something reusable first.
- Feature-specific UI (only used by one feature) lives inside that feature's own
  `_components/` folder — see folder structure below.
- No copy-pasted near-duplicate components. If two components diverge only by small props,
  parameterize one component instead of forking it.

## 5. Server state — TanStack Query

- All server communication (REST calls to the backend) goes through **TanStack Query**
  (`@tanstack/react-query`) — no ad-hoc `useEffect` + `fetch` for data that TanStack Query
  should own.
- Per feature, keep **API call functions** and **query/mutation hooks** in separate files:
  - `src/features/<feature>/api/<feature>.ts` — plain functions that call the backend
    (fetch/axios), typed request/response, no React here.
  - `src/features/<feature>/hooks/use-<thing>.ts` — `useQuery`/`useMutation` hooks that call
    the functions from `api/`, own the query keys, and handle cache invalidation.
- Centralize the shared `QueryClient` and any base fetch client (axios instance with
  `withCredentials: true`, base URL from env) in `src/lib/`.
- Name query keys consistently per feature (e.g. `["auth", "session"]`) so invalidation from
  mutations stays easy to follow.
- **Consuming a hook in a component** — import it straight from the feature's `hooks/`
  file and destructure what you need off the mutation/query result. Don't call `api/`
  functions directly from components; always go through the hook.

  ```ts
  // src/features/auth/hooks/use-sign-in.ts
  import { useMutation } from "@tanstack/react-query";
  import { signIn } from "../api/auth";

  /**
   * useSignIn — mutation hook for POST /api/auth/sign-in.
   * @returns TanStack mutation result: call `mutate({ email, password, role })` to sign in.
   */
  export const useSignIn = () => {
    return useMutation({
      mutationFn: signIn,
    });
  };
  ```

  ```tsx
  // src/features/auth/_components/sign-in-form.tsx
  import { useSignIn } from "../hooks/use-sign-in";

  /**
   * SignInForm — collects credentials and triggers sign-in.
   */
  const SignInForm = () => {
    const { mutate, isPending, isError, error } = useSignIn();

    const handleSubmit = (values: { email: string; password: string; role: string }) => {
      mutate(values);
    };

    return (
      // ...form JSX, disable submit while isPending, show error when isError
      <></>
    );
  };

  export default SignInForm;
  ```

  Same pattern for queries — e.g. `const { data, isLoading, isError } = useSession();` —
  where `useSession` wraps `useQuery` around an `api/` function.

## 6. Folder structure

Mirrors the clean, feature-first structure from the user's previous projects
(`nodebase`, `project-iq`, `repo-mind`), adapted for this stack: Vite + React Router (no
Next.js app router) and a plain REST backend (no tRPC — this backend is Express, so API
calls are real HTTP calls, not RPC procedures).

```
src/
  app/                    # app shell: router setup, providers (QueryClientProvider, etc.)
  pages/                  # route-level components (wired up in the router)
  features/
    auth/
      api/                # fetch functions hitting /api/auth/*
      hooks/               # useSignIn, useSignUp, useRefreshToken, useLogout, useSession
      _components/         # sign-in-form.tsx, sign-up-form.tsx, etc.
      types/               # request/response types for this feature
    products/
      api/
      hooks/
      _components/
      types/
    cart/
      ...
  components/
    ui/                   # shadcn-generated primitives
    ...                   # global reusable components (Navbar, Footer, EmptyState, etc.)
  hooks/                  # global reusable hooks (not tied to one feature)
  lib/                    # http client, query client, utils.ts (shadcn cn()), constants
  types/                  # app-wide shared types
.claude/
  plan/                   # phase-<n>-<phase-name>.md plans, one per feature phase
```

Rules:
- A folder/file for a feature only exists once that feature has real work — don't
  pre-scaffold every feature up front.
- Don't leak one feature's internals into another; cross-feature reuse goes through
  `src/components/`, `src/hooks/`, or `src/lib/`.
- **`src/pages/` stays flat** — one file per route, wired into the router. Never nest a
  `_components/` or `types/` folder under `src/pages/<page>/`. If a page's JSX grows enough
  to split into subcomponents, or it needs its own dummy/request/response types, that content
  belongs in `src/features/<name>/_components/` and `src/features/<name>/types/` — create the
  feature folder even if it has no `api/`/`hooks/` yet (e.g. a UI-first phase using placeholder
  data ahead of real backend integration). The page file itself stays a thin route-level
  composition that imports from that feature folder, the same way `sign-in-page.tsx` renders
  `<SignInForm />` from `src/features/auth/_components/`.

## 7. Path aliases & setup notes

- This project currently has **no `@/` alias, no Tailwind, no shadcn, and no TanStack Query
  installed** — it's a bare `npm create vite` scaffold (React 19 + TS + ESLint only). The
  first phase of work should set these up (Tailwind, `@/` alias in `vite.config.ts` +
  `tsconfig.app.json`, `components.json` for shadcn, `@tanstack/react-query`, and a router —
  confirm the router choice, e.g. React Router, with the user) before feature work begins,
  unless the user says it's already been done.
