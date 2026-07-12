## Scholaria — Full backend migration (phased)

Moves the app from mock data to a real Supabase-backed platform: schema, auth onboarding, storage, and each surface wired up. Delivered in 3 phases so we can verify between them.

### Global changes (apply in Phase 1)

**Landing page (`/`)**: Rebuild as an official product marketing page (not pitch-deck sections). Hero + value props + feature grid + FAQ + footer, clean slate/blue theme, "Get Started Free" → `/auth`. No "The Problem / Effects & Causes / Solution" pitch sections.

**Auth**: Keep email/password only (no Google). Onboarding after sign-up collects `name`, `school`, `grade`, `subjects[]`. Drop `age` from profile.

**Design tokens**: Reuse existing slate/blue semantic tokens in `src/styles.css`. All new surfaces use loading skeletons and empty-state components.

**Route protection**: Move all app routes under `src/routes/_authenticated/` (dashboard, assignments, tetris, calendar, resources, timetable, messages). Landing `/`, `/auth`, `/reset-password` stay public.

---

### Phase 1 — Schema, auth, dashboard, assignments

**Migration 1 — schema + RLS + storage**
- `profiles`: add `school text`, `subjects text[]`, `avatar_url text`; drop `age`. Update `handle_new_user` trigger.
- `assignments`: id, student_id (auth.uid), title, description, subject, due_date, estimated_time int, status enum (`pending|in_progress|submitted|graded|overdue`), grade text, feedback text, attachments text[], created_at, updated_at.
- `resources`: id, uploaded_by, title, type enum (`Notes|Worksheet|Past Paper|Video`), subject, file_url, syllabus_relevant bool, created_at.
- `timetable`: id, user_id, day (0–6), start_time time, end_time time, subject, room, teacher_name.
- `submissions`: id, assignment_id, student_id, file_url, submitted_at.
- All tables: `GRANT` to `authenticated` + `service_role`, RLS enabled, policies scoped to `auth.uid() = student_id/user_id/uploaded_by`. `updated_at` triggers.
- Storage buckets (via tool): `assignment-attachments` (private), `submissions` (private), `resources` (private), `avatars` (public). RLS on `storage.objects` scoping writes/reads to owner folder (`auth.uid()::text/...`).

**Onboarding**: New `/onboarding` route inside `_authenticated`; redirect there if `profiles.school` is null. Form for school, grade, subjects (multi-select from a fixed subject list).

**Dashboard**: Replace mock counts with live queries — overdue (due_date<now, status!=submitted/graded), due today, due this week, today's schedule (timetable rows for today's weekday). Quick-action buttons open Add Assignment / Upload Resource dialogs. Header greeting already uses profile name.

**Assignments**:
- "New Assignment" dialog: title, description, subject (from user's subjects), due_date, file attachments (upload to `assignment-attachments/{uid}/...`).
- Auto-estimate on submit using existing `estimateMinutes` rule engine; store on row (read-only badge shown from DB value).
- Filters by status + subject; list from DB.
- Card actions: mark in-progress / submitted / graded, upload submission file (writes `submissions` row), enter grade + feedback inline.
- Overdue status computed on read (view or client-side derived from due_date).

**Verify**: sign up → onboard → create assignment with attachment → mark submitted → see dashboard counts update.

---

### Phase 2 — Timetable + Calendar

**Timetable page** (new `/timetable`): form to add/edit/delete class rows (day, start, end, subject, room, teacher). List grouped by day. Dashboard "Today's schedule" reads from this table.

**Calendar**: Monthly grid pulling `assignments.due_date` and `timetable` recurring events for the visible month. Color-coded by subject (map subject → color from a shared palette). Click a day → list of items.

**Verify**: add classes → see them on Dashboard/Today and blocked in Tetris; assignments show on Calendar.

---

### Phase 3 — Tetris persistence + Resources

**Deadline Tetris**:
- New table `tetris_placements` (id, user_id, assignment_id, week_start date, day int, start_slot int, duration_min int, part_index int, part_total int). RLS by user_id. GRANTs.
- Load pending/in-progress assignments from DB. Timetable rows render as immovable grey blocks.
- Drag/drop, Smart Arrange (existing greedy w/ 10h cap), Manual Split (2–5 parts on consecutive days before due date) — all write to `tetris_placements`.
- "Save My Week" persists current layout for the visible week; layout reloads on next visit.

**Resources**:
- Upload dialog: file → `resources/{uid}/...` in storage, metadata row in `resources`. Fields: title, type, subject, syllabus_relevant toggle.
- Grid from DB with search, subject filter, type filter. Preview (open signed URL) + Download (signed URL).

**Verify**: upload PDF → appears in list → preview/download works; drag a block in Tetris, reload, block is still there.

---

### Technical notes

- All DB access via `createServerFn` with `requireSupabaseAuth`, called from `_authenticated` route loaders or via `useServerFn` + TanStack Query. `client.server` / service role not needed for user data.
- File uploads use the browser Supabase client directly (RLS on `storage.objects` enforces ownership).
- `src/lib/mock-data.ts` stays only as the shared `subjects` palette source; per-user subjects come from `profiles.subjects`.
- `assignment-estimate.ts` stays as the rule engine; used at insert time server-side to compute `estimated_time`.
- Split state (`useSplits`) is replaced by `tetris_placements.part_index/part_total`.

### What's out of scope

- Google OAuth (per your answer)
- Messages/notices persistence (existing mock stays untouched this pass)
- Push notifications / real reminders (Tetris "Save" just persists layout)
- Teacher/parent roles (student-only)