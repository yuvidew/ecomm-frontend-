# Admin sidebar update — trigger, icon-collapse, rail, group label

## Context
Phase 3 gave the admin sidebar its emerald color; phase 5 polished the rest of the admin
surfaces. The user asked to update the sidebar specifically. Reading `src/components/ui/
sidebar.tsx` (the shadcn primitive itself) turned up a real, user-facing gap rather than just a
cosmetic one:

- **No `SidebarTrigger` was rendered anywhere in the app** (confirmed via grep). `SidebarProvider`
  opens the sidebar by default on desktop, but on mobile `openMobile` starts `false` and nothing
  ever set it `true` except `toggleSidebar()` — wired only to the desktop keyboard shortcut
  (Ctrl/Cmd+B) and this never-rendered trigger. **On a phone or narrow tablet there was no way to
  open the admin sidebar at all** — Products, Categories, and the user/logout menu were
  unreachable.
- `AppSidebar` used `collapsible="offcanvas"`, so on desktop, toggling fully hid the sidebar
  rather than collapsing it to an icon rail. The rest of the sidebar code already anticipated
  icon-collapse mode: `NavMain` passes `tooltip={item.title}` to every `SidebarMenuButton` (only
  meaningful when collapsed to icons), and the primitive's own sizing classes
  (`group-data-[collapsible=icon]:p-0!`, etc.) were already baked in — `collapsible="icon"` was
  clearly the intended mode and was just never set. Confirmed from the primitive's source: on
  mobile the sidebar always renders as a `Sheet` regardless of `collapsible` (the `isMobile`
  branch is checked before any collapsible-specific desktop rendering), so switching this is safe
  for mobile.
- `SidebarRail` (a thin click/drag edge affordance) and `SidebarGroupLabel` (a small heading above
  a nav group) both existed in the primitive and were unused.

No new dependencies, no new colors/tokens — reusing primitives already installed and (in the
tooltip's case) already half-wired.

## Design direction
Same restraint as phase 5: the sidebar is a navigation tool, not a decoration surface. Every
change turns on or exposes machinery the sidebar primitive already ships, rather than adding new
visual elements — the emerald `--sidebar-*` tokens apply automatically to the icon-collapsed
state since it's the same `Sidebar` root.

## 1. Fixed the missing toggle — `src/components/site-header.tsx`
Added `<SidebarTrigger />` (ghost icon button, `sr-only` "Toggle Sidebar" text) at the start of
the header, before the title/breadcrumb, with a vertical `Separator` after it. This is the
primary fix — the only way an admin on a narrow viewport can open the sidebar at all.

## 2. Icon-collapse instead of full hide — `src/components/app-sidebar.tsx`
`collapsible="offcanvas"` → `collapsible="icon"`. Desktop users get a persistent icon rail when
collapsed (with the nav tooltips finally doing their job) instead of the sidebar vanishing
entirely. Mobile is unaffected (always a `Sheet`).

## 3. Added the edge-rail affordance — `src/components/app-sidebar.tsx`
`<SidebarRail />` rendered as the last child inside `<Sidebar>`. A second, more discoverable way
to toggle on desktop (click, or the resize-style cursor hint).

## 4. Group label for the nav items — `src/components/nav-main.tsx`
`<SidebarGroupLabel>Catalog</SidebarGroupLabel>` above `SidebarGroupContent`. Hidden automatically
when collapsed to icon mode (built into the primitive).

## Files touched
`src/components/site-header.tsx`, `src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`.

## Out of scope
New nav items/sections, sidebar color/theming (Phase 3 territory), the mobile `Sheet`
presentation itself (already correct).

## Accessibility/UX pass
Ran the `web-design-guidelines` skill against the three touched files. Fixed two findings that
followed directly from switching to icon-collapse: the brand/logo link had no `tooltip` prop
(unlike the nav items below it, so a collapsed sidebar gave no way to identify it on hover), and
the nav/brand icons (decorative, always paired with visible text) were missing
`aria-hidden="true"`.

## Verification
1. `npx tsc -b --noEmit`, `npm run build`, and `npm run lint` all pass clean.
2. Confirmed `/admin` still redirects correctly to `/sign-in` with no console errors
   (unauthenticated check — admin routes need a signed-in session, which this session didn't
   authenticate through, same as phase 5).
3. Still to confirm when signed in: the header trigger opens/closes the sidebar on both desktop
   and a narrow viewport, the collapsed state shows an icon rail with working tooltips (including
   the brand icon now), the edge rail toggles it too, and "Catalog" appears above the nav items
   (hidden while collapsed).
