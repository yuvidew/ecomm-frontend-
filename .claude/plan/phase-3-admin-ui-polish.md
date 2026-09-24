# Admin UI polish — emerald sidebar, flat pages, taller buttons, better product card

## Context
The admin dashboard still looks like the stock shadcn `dashboard-01` block: a near-white
sidebar, and the content area rendered as an inset "floating card" (margin + rounded corners +
`shadow-sm`, from `variant="inset"`). The user wants the sidebar in the project's emerald theme
color, the pages flat (no shadow / covered-card look), taller buttons everywhere, and a nicer
product card. No backend work — pure frontend styling.

Decisions confirmed with the user:
- Sidebar: **solid emerald** background, white text, active item = translucent white pill.
- Buttons: **default 40px** (h-10), with the other sizes scaled up to match.

Per CLAUDE.md, on approval first save this plan as `.claude/plan/phase-3-admin-ui-polish.md`.

## 1. Emerald sidebar — `src/index.css`
Only change the sidebar tokens (the shadcn `Sidebar` already reads them everywhere, including
the mobile Sheet), no class overrides in components:

`:root`
- `--sidebar`: `var(--primary)`-equivalent → `oklch(0.508 0.118 165.612)` (current `--primary`)
- `--sidebar-foreground`: `oklch(0.985 0 0)` (white)
- `--sidebar-accent`: `oklch(1 0 0 / 15%)` (hover/active pill)
- `--sidebar-accent-foreground`: `oklch(0.985 0 0)`
- `--sidebar-primary` / `--sidebar-primary-foreground`: white / emerald (inverted, for anything using primary inside the sidebar)
- `--sidebar-border`: `oklch(1 0 0 / 15%)`, `--sidebar-ring`: `oklch(1 0 0 / 40%)`

`.dark`: same idea based on the dark `--primary` (`oklch(0.432 0.095 166.913)`), same white/translucent values.

Small component touch-ups so nothing looks grey-on-green:
- `src/components/nav-user.tsx` — role text `text-muted-foreground` → `text-sidebar-foreground/70`;
  `AvatarFallback` gets `bg-sidebar-accent text-sidebar-foreground`.
- `src/components/nav-main.tsx` — active item: add `data-[active=true]:font-semibold` on
  `SidebarMenuButton` so the active page reads clearly on the pill.

## 2. Remove the shadow / covered look on pages — `src/app/admin-layout.tsx`
- `<AppSidebar variant="inset" />` → `<AppSidebar />` (default `"sidebar"` variant).
  This drops the wrapper's `bg-sidebar` fill and the `SidebarInset` `m-2 rounded-xl shadow-sm`
  styles (driven by `peer-data-[variant=inset]` in `components/ui/sidebar.tsx`), so pages sit
  flat on `bg-background` edge-to-edge next to the sidebar. No edits to the shadcn primitive.
- Also remove the stray `transition-shadow` on the product `Card` (see §4).

## 3. Taller buttons — `src/components/ui/button.tsx`
Edit the `size` variants in `buttonVariants` (single source; every `<Button>` picks it up):
| size | now | new |
|---|---|---|
| xs | h-6 | h-7 |
| sm | h-7 | h-9, px-3 |
| default | h-8 | h-10, px-4 |
| lg | h-9 | h-11, px-5 |
| icon-xs / icon-sm / icon / icon-lg | 6 / 7 / 8 / 9 | 7 / 9 / 10 / 11 |

`SiteHeader` is `h-12` (`--header-height`), so `sm` (h-9) header actions still fit. Pagination
links use `buttonVariants` too and will grow with it — acceptable.

## 4. Better product card — `src/features/products/_components/product-card.tsx`
Same props (`{ product: Product }`), same link target, rebuilt from existing shadcn `Card`,
`AspectRatio`, `Badge` + `formatPrice`/`formatDate` from `src/lib/format.ts`:
- **Image**: square (`ratio={1}`) on `bg-muted`, subtle zoom on hover (kept). Stock badge
  overlaid top-left on the image (`In stock · N` secondary / `Low stock · N` when `stock <= 5` /
  `Out of stock` destructive). Out-of-stock image gets `opacity-60 grayscale`.
- **Body**: name `line-clamp-2` with a fixed min-height so rows align; description
  `line-clamp-1 text-muted-foreground` (only when present).
- **Footer row**: price large, `text-primary font-semibold tabular-nums`; right side a small
  `ArrowUpRightIcon` that fades/slides in on hover. Muted "Updated {formatDate(updated_at)}"
  line under it.
- **Hover/focus**: flat — no shadow; border shifts to `ring-primary/40` and a `-translate-y-0.5`
  lift. Keep existing focus-visible ring on the `Link`.
- `product-grid.tsx`: update the loading `Skeleton` aspect to match the new card height
  (`aspect-[3/4.4]`-ish) so the layout doesn't jump.

Updated `@param` doc comment on `ProductCard`; arrow-function style kept.

## Files touched
- `src/index.css` (sidebar tokens, light + dark)
- `src/app/admin-layout.tsx`
- `src/components/nav-user.tsx`, `src/components/nav-main.tsx`
- `src/components/ui/button.tsx`
- `src/features/products/_components/product-card.tsx`, `product-grid.tsx`
- `.claude/plan/phase-3-admin-ui-polish.md` (copy of this plan)

## Out of scope
Storefront/customer pages, new features, category name on the card (would need the
categories feature inside products — cross-feature leak), dark-mode toggle.

## Verification
1. `npm run build` (tsc + vite) and `npm run lint` pass.
2. `npm run dev`, sign in as admin, check `/admin`, `/admin/categories`, a product detail and
   the product form:
   - sidebar is emerald with white text; hover/active pills visible; user menu readable;
     mobile width (<768px) sheet sidebar is also emerald.
   - content area is flat, no rounded shadowed panel or grey gutter around it.
   - buttons (header "New product", dialogs, pagination, sign-in form) are visibly taller and
     still fit the header.
   - product grid: cards align, stock badge states (in / low / out), hover lift without shadow,
     loading skeletons match card size.
