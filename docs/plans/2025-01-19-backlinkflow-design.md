# BacklinkFlow Design Document

## Overview

A directory-based SaaS platform where indie hackers discover backlink building platforms, add them to a personal board, and track submission progress.

**Tech Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Directus SDK

**Backend:** Directus at `directus-backflow.aimazing.site`

---

## Data Schema (Directus Collections)

### `users` (custom collection)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| email | string | Unique, required |
| name | string | Display name |
| avatar_url | string | Profile picture |
| auth_provider | enum | `email`, `google`, `github` |
| provider_id | string | OAuth provider's user ID |
| password_hash | string | Only for email/password users |
| date_created | timestamp | Auto |
| last_login | timestamp | Updated on each login |

### `platforms`
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | Required |
| slug | string | URL-friendly, unique |
| website_url | string | Required |
| description | text | Short description |
| logo | file (image) | Platform logo |
| domain_authority | integer | 0-100 score |
| cost_type | enum | `free`, `paid`, `freemium` |
| status | enum | `published`, `pending_review`, `rejected` |
| categories | M2M | Links to `categories` |
| date_created | timestamp | Auto |
| user_created | M2O | Who submitted (for UGC) |

### `categories`
| Field | Type |
|-------|------|
| id | uuid |
| name | string |
| slug | string |

### `platforms_categories` (junction table)
| Field | Type |
|-------|------|
| id | uuid |
| platforms_id | M2O |
| categories_id | M2O |

### `user_boards`
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user | M2O | Links to `users` |
| platform | M2O | Links to `platforms` |
| status | enum | `todo`, `in_progress`, `submitted`, `live` |
| backlink_url | string | Filled when status = live |
| notes | text | Personal notes |
| date_created | timestamp | Auto |
| date_updated | timestamp | Auto |

---

## Frontend Architecture

```
/app
  /(public)
    /page.tsx                    # Home / Directory page
    /platform/[slug]/page.tsx    # Platform detail (optional)
    /submit/page.tsx             # Submit new platform form
  /(auth)
    /login/page.tsx              # Login (email + social)
    /register/page.tsx           # Register
  /(protected)
    /board/page.tsx              # User's board/checklist
  /api
    /auth/google/route.ts        # Google OAuth handler
    /auth/github/route.ts        # GitHub OAuth handler
    /auth/callback/route.ts      # OAuth callback
    /auth/logout/route.ts        # Logout handler
  /layout.tsx                    # Root layout
/components
  /ui                            # Button, Input, Card, Badge, etc.
  /platform-card.tsx
  /board-item.tsx
  /filter-sidebar.tsx
  /navbar.tsx
  /footer.tsx
  /theme-toggle.tsx
  /kanban-board.tsx
/lib
  /directus.ts                   # Directus SDK client
  /auth.ts                       # Auth helpers
/stores
  /board-store.ts                # Zustand store for board state
/hooks
  /use-platforms.ts
  /use-board.ts
  /use-auth.ts
```

---

## Page Layouts

### Home / Directory Page
```
┌─────────────────────────────────────────────────────────┐
│ Navbar: Logo | Directory | My Board | [Theme] [Auth]    │
├─────────────────────────────────────────────────────────┤
│ Hero: "Stop guessing where to post."                    │
│ Subtitle + "Get Started" CTA                            │
├──────────────┬──────────────────────────────────────────┤
│ Filters      │ Platform Grid (3-4 cols)                 │
│ ──────────── │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ [Search...] │ │ Logo    │ │ Logo    │ │ Logo    │     │
│              │ │ Name    │ │ Name    │ │ Name    │     │
│ Categories   │ │ Desc... │ │ Desc... │ │ Desc... │     │
│ ☑ SaaS      │ │ DA:45   │ │ DA:72   │ │ DA:30   │     │
│ ☑ AI        │ │ [+ Add] │ │[Added ✓]│ │ [+ Add] │     │
│ ☐ Startup   │ └─────────┘ └─────────┘ └─────────┘     │
│              │                                          │
│ Cost Type    │                                          │
│ ○ All       │                                          │
│ ○ Free      │                                          │
│ ○ Paid      │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### My Board Page (Kanban View)
```
┌─────────────────────────────────────────────────────────┐
│ Progress: ████████░░░░░░░░ 4/12 Live (33%)             │
├─────────────────────────────────────────────────────────┤
│ View Toggle: [List] [Board]                             │
├─────────────────────────────────────────────────────────┤
│ TO DO        │ IN PROGRESS │ SUBMITTED  │ LIVE         │
│ ┌──────────┐ │ ┌──────────┐│            │ ┌──────────┐ │
│ │Platform A│ │ │Platform C││            │ │Platform B│ │
│ │ [notes]  │ │ │ [notes]  ││            │ │ link:... │ │
│ │ [delete] │ │ │          ││            │ │          │ │
│ └──────────┘ │ └──────────┘│            │ └──────────┘ │
└──────────────┴─────────────┴────────────┴──────────────┘
```

---

## Authentication Flow

```
User → Next.js API (/api/auth/google) → Google OAuth
                                      ↓
                    ← access_token ← Google returns user info
                                      ↓
         Next.js API → Directus SDK → Create/find user in `users` collection
                                      ↓
         Next.js API → Generate JWT session → Set httpOnly cookie → Redirect
```

**Supported Auth Methods:**
- Email/Password
- Google OAuth
- GitHub OAuth

**Session Management:**
- JWT stored in httpOnly cookie
- Middleware validates JWT on protected routes
- Directus SDK uses static admin token for backend operations

---

## State Management

**Zustand Board Store:**
```typescript
interface BoardStore {
  items: BoardItem[]
  isLoading: boolean
  addToBoard(platformId: string): void
  removeFromBoard(itemId: string): void
  updateStatus(itemId: string, status: Status): void
  updateNotes(itemId: string, notes: string): void
  setBacklinkUrl(itemId: string, url: string): void
}
```

**Optimistic Updates:**
1. User action → Immediate UI update
2. Background API call to Directus
3. On failure → Rollback UI + show error toast

**Data Fetching:**
| Page | Method | Cache |
|------|--------|-------|
| Directory | Server Component | ISR (60s) |
| Board | Client + React Query | Zustand |

---

## Dependencies

**Core:**
- next (15+)
- typescript
- tailwindcss (v4)
- lucide-react

**Data & Auth:**
- @directus/sdk
- jose (JWT handling)

**State & UI:**
- zustand
- @tanstack/react-query
- @dnd-kit/core, @dnd-kit/sortable
- next-themes
- sonner

**Forms:**
- react-hook-form
- zod

---

## UI Features

- Dark/Light mode toggle (next-themes)
- Responsive design (mobile-friendly)
- Skeleton loaders during fetch
- Toast notifications for errors/success
- Empty states with CTAs
- Drag-and-drop Kanban board

---

## Environment Variables

```env
# Directus
DIRECTUS_URL=https://directus-backflow.aimazing.site
DIRECTUS_TOKEN=RguUCCYA6fYah3rc_2wNQVMd8Zr7G1AA

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Session
JWT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
