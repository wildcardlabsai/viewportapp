

# Build All Features -- Comprehensive Implementation Plan

## Overview
This plan covers 10 features that will transform the app into a full-featured screenshot platform. They are ordered by dependency (features that later ones depend on come first).

---

## Feature 1: Connect Captures to Projects

Wire up the existing `project_id` column on `capture_jobs` so users can assign captures to projects.

**Changes:**
- `src/pages/Dashboard.tsx` -- Add a project selector dropdown (fetches user's projects) that sets `project_id` on the capture job insert
- `src/pages/History.tsx` -- Add a project filter dropdown; show project name badge on each capture
- `src/pages/Projects.tsx` -- Make each project card clickable to show its captures (filtered History view); add edit/delete buttons

---

## Feature 2: Bulk Captures

Allow users to paste multiple URLs and capture them all at once.

**Changes:**
- `src/pages/Dashboard.tsx` -- Add a "Bulk" tab alongside the single URL input. Bulk tab shows a textarea for pasting multiple URLs (one per line or comma-separated). On capture, loop through all URLs and create jobs for each URL x each selected device. Show a progress indicator.

---

## Feature 3: Annotation / Markup Tools

Let users draw on screenshots with arrows, text, and blur regions.

**Changes:**
- Create `src/components/AnnotationEditor.tsx` -- A canvas-based overlay editor using HTML Canvas API:
  - Tool palette: arrow, rectangle, text, blur, freehand
  - Color and size pickers
  - Undo/redo stack
  - "Save" composites the annotations onto the image and uploads to storage as a new `capture_asset` with `is_annotation = true`
- `src/pages/History.tsx` -- Add an "Annotate" button (Pencil icon) for completed captures that opens the AnnotationEditor

---

## Feature 4: Visual Comparison (Side-by-Side)

A tool to compare two screenshots with a slider overlay.

**Changes:**
- Create `src/components/CompareDialog.tsx` -- A dialog with:
  - Two image selectors (pick from recent captures)
  - A draggable slider that reveals one image over the other (CSS clip-path approach)
  - Toggle between slider, side-by-side, and overlay (opacity blend) modes
  - Download comparison as PNG
- `src/pages/History.tsx` -- Add a "Compare" button; selecting two captures via checkboxes enables the compare action

---

## Feature 5: API Keys Management UI

Build a dashboard for the existing `api_keys` table.

**Changes:**
- Create `src/components/ApiKeysSection.tsx` -- A section component for Settings:
  - List existing keys (showing `key_prefix`, `name`, `created_at`, `last_used_at`)
  - "Create Key" button generates a random key, hashes it, stores the hash, and shows the full key once (copy to clipboard)
  - Delete button to revoke keys
  - Uses `crypto.subtle` for SHA-256 hashing client-side
- `src/pages/Settings.tsx` -- Import and render the ApiKeysSection

---

## Feature 6: Usage Analytics Dashboard

Build a visual dashboard from `usage_records` and `capture_jobs` data.

**Changes:**
- Create `src/components/UsageDashboard.tsx` -- A component using `recharts` (already installed):
  - Line chart: captures per day over the last 30 days
  - Bar chart: captures by device type
  - Pie chart: captures by status (completed/failed)
  - Summary cards: total captures, success rate, most-captured domain
- `src/pages/Settings.tsx` -- Replace the basic stats section with the full UsageDashboard component

---

## Feature 7: Custom CSS Injection

Let users inject custom CSS before capture to style or hide elements.

**Changes:**
- `src/pages/Dashboard.tsx` -- Add a "Custom CSS" textarea under the Element Hiding tab. Store the value in state.
- Database migration: Add `custom_css text` column to `capture_jobs` table
- `supabase/functions/process-captures/index.ts` -- Pass `css` parameter to the ScreenshotOne API call from `job.custom_css`

---

## Feature 8: Scheduled / Recurring Captures

Allow users to schedule captures to run on a recurring basis.

**Changes:**
- Database migration: Create `scheduled_captures` table with columns: `id`, `user_id`, `url`, `device_preset`, `viewport_width`, `viewport_height`, `cron_expression`, `project_id`, `is_active`, `last_run_at`, `next_run_at`, `capture_options` (jsonb), `created_at`
- Create `src/pages/Schedules.tsx` -- Page to create/edit/delete scheduled captures with preset frequencies (daily, weekly, hourly)
- Create `supabase/functions/run-scheduled-captures/index.ts` -- Edge function that queries active schedules whose `next_run_at` has passed, creates capture jobs, and updates `next_run_at`
- Set up a pg_cron job to invoke this function every minute
- `src/components/DashboardLayout.tsx` -- Add "Schedules" nav item
- `src/App.tsx` -- Add `/schedules` route

---

## Feature 9: Team Collaboration UI

Build UI for the existing `teams` and `team_members` tables.

**Changes:**
- Create `src/pages/Team.tsx` -- Page with:
  - Create team form
  - Team member list with roles (owner/admin/member)
  - Invite member by email (insert into `team_members`)
  - Remove member
  - Assign projects to teams
- `src/components/DashboardLayout.tsx` -- Add "Team" nav item (Users icon)
- `src/App.tsx` -- Add `/team` route

---

## Feature 10: PDF Export

The capture engine already supports PDF format via ScreenshotOne. This is about enhancing the download experience.

**Changes:**
- `src/pages/History.tsx` -- For PDF captures, show a PDF icon instead of image thumbnail; open in a new tab on click instead of inline preview
- `src/components/MockupDialog.tsx` -- Add a "Download as PDF" option that uses the browser's print API to export the mockup as PDF

---

## File Summary

| File | Action | Features |
|------|--------|----------|
| `src/pages/Dashboard.tsx` | Edit | #1 Project selector, #2 Bulk URLs, #7 Custom CSS |
| `src/pages/History.tsx` | Edit | #1 Project filter, #3 Annotate button, #4 Compare, #10 PDF handling |
| `src/pages/Projects.tsx` | Edit | #1 Clickable projects, edit/delete |
| `src/pages/Settings.tsx` | Edit | #5 API Keys section, #6 Usage dashboard |
| `src/pages/Schedules.tsx` | Create | #8 Scheduled captures |
| `src/pages/Team.tsx` | Create | #9 Team management |
| `src/components/AnnotationEditor.tsx` | Create | #3 Markup tools |
| `src/components/CompareDialog.tsx` | Create | #4 Visual comparison |
| `src/components/ApiKeysSection.tsx` | Create | #5 API key management |
| `src/components/UsageDashboard.tsx` | Create | #6 Analytics charts |
| `src/components/DashboardLayout.tsx` | Edit | #8 #9 Nav items |
| `src/App.tsx` | Edit | #8 #9 Routes |
| `supabase/functions/process-captures/index.ts` | Edit | #7 Custom CSS param |
| `supabase/functions/run-scheduled-captures/index.ts` | Create | #8 Scheduled runner |
| DB migration | Run | #7 `custom_css` column, #8 `scheduled_captures` table |

---

## Implementation Order

1. DB migrations first (custom_css column + scheduled_captures table)
2. Features 1, 2, 5, 6, 7 (independent, can be built in sequence)
3. Features 3, 4 (annotation + compare -- more complex UI)
4. Features 8, 9 (new pages + edge function)
5. Feature 10 (small enhancement)

