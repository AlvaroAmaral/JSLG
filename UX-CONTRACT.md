# JSLG Frontend UX Contract

## Product context

- **Audience:** Portuguese-speaking coordinators of Jovens de São Luís Gonzaga.
- **Primary jobs:** Maintain member contacts, schedule and update gatherings, and register or review attendance.
- **Active locale:** `pt-BR`.
- **Timezone/calendar policy:** Use the browser's local timezone for event entry/display and Brazilian date/time formatting. The API stores event timestamps as local `TIMESTAMP` values.
- **Accessibility target:** WCAG 2.2 AA intent; labeled controls, keyboard-visible focus, reduced motion, semantic table/list markup, live status feedback, and responsive reflow.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed |
|---|---|---|---|
| API operations and coordinator access | `README.md` API section; `src/main/java/br/org/jslg/controller/` | API documentation / implementation | 2026-09-29 |
| Member removal and email uniqueness | `src/main/java/br/org/jslg/service/MembroService.java`; `src/main/resources/db/migration/` | Domain implementation / schema | 2026-09-29 |
| Future events, cancellation, attendance uniqueness | `src/main/java/br/org/jslg/service/EventoService.java`, `PresencaService.java` | Domain implementation | 2026-09-29 |
| Event artwork, descriptions, and automatic realized section | `src/main/java/br/org/jslg/service/EventoService.java`, `frontend/src/main.jsx` | Domain implementation | 2026-09-30 |
| Master management of coordinator accounts and sessions | `README.md` API section; coordinator controller/service and `frontend/src/main.jsx` | Domain implementation | 2026-09-30 |
| Product visual language | `DESIGN.md` | Maintained design context | 2026-09-29 |

## Canonical UI map

| Capability | Canonical owner | Source of truth | Variant | Verification |
|---|---|---|---|---|
| Select/listbox | Native `<select>` | Browser control + this contract | Native, labeled | Keyboard and mobile popup behavior |
| Date | `DatePicker` in `frontend/src/main.jsx` | This contract + API `LocalDateTime` | Authored calendar + native time input | Keyboard, locale, past/future selection, focus return |
| Form | `Editor` shared dialog | API request DTOs; `Editor` | Member / gathering with optional description/artwork | Required fields, pending and failure |
| Scrollbar | `frontend/src/style.css` | `DESIGN.md` | Global, horizontal table surface | Computed theme and visible overflow |
| Toast | App-level toast region in `App` | This contract | Success acknowledgement | `role=status`, polite announcement |
| CRUD | `App` API handlers + shared page destinations | README routes and Java services | Return to originating list | API success/failure and preserved dialog |
| Coordinator access administration | `CoordinatorsPage` + `CoordinatorEditor` and named delete confirmation | Master-only coordinator API | Refresh coordinator list; changed password revokes existing sessions | Keep dialog open and show API error |
| Gathering list and artwork preview | `EventsPage` + `EventCard` / `EventArtwork` in `frontend/src/main.jsx` | Event lifecycle and optional artwork API | Upcoming, completed, and canceled cards | Artwork loaded / missing / unavailable; actions by lifecycle state |
| Table selection | Not supported | No bulk action exists | None | No selection affordance |

## Navigation and responsive behavior

- The four destinations remain in a stable order: Visão geral, Membros, Encontros, Presenças.
- Desktop uses a persistent labeled sidebar. Mobile uses a labeled bottom navigation with safe-area padding. The selected destination uses `aria-current="page"`.
- These destinations are client-side views, not independently addressable routes; search and transient state remain local and are not written to the URL.
- Members remain a semantic table with horizontal overflow at narrow widths so contacts can be compared without silently hiding columns.
- Each view updates `document.title` to `{Page} — JSLG`.
- Dialogs close on Escape or the close/cancel action. Focus moves into the dialog, Tab stays within it, and closing restores the previously focused element.

## Flow ledger

| Operation | Trigger | Pending | Success destination / feedback | Failure recovery |
|---|---|---|---|---|
| Create/edit member | Members action and shared editor | Save action disabled with progress label | Members view; concise success toast | Keep editor open and show an actionable page alert |
| Remove member | Row action, then named confirmation | Confirm action disabled | Members view; removal toast | Keep confirmation open; explain server response |
| Create/edit gathering | Agenda action and shared editor | Save action disabled with progress label | Agenda view; concise success toast | Keep editor open and show page alert |
| Cancel gathering | Agenda action, then named confirmation | Confirm action disabled | Agenda view; retained as canceled history | Keep confirmation open; explain server response |
| Edit coordinator access | Master action on a common coordinator | Save action disabled; blank password retains existing password | Refresh access list; password reset revokes existing sessions | Keep editor open and show API error |
| Delete coordinator access | Master action, then named confirmation | Confirm action disabled | Refresh access list; account sessions are rejected | Keep confirmation open and show API error |
| Add/remove attendance | Attendance selector or row action | Prevent duplicate mutation | Selected gathering; success toast | Keep selection and refresh records when possible |
| Search members | Local search field | Immediate local filtering | Retain current view and query | Empty results offer query correction |
| Session expires | API returns 401 | Clear local token and coordinator identity | Return to login | Login explains the session ended |

## Forms, confirmation, and feedback

- The authored calendar uses `pt-BR` month/day labels, Monday-first weeks, a visible selected day, keyboard arrow and PageUp/PageDown navigation, past and future date selection, and focus return to its trigger. Past dates are available for historical event records. Time uses a labeled native local-time input; forms require the fields required by the API and keep labels visible.
- Member Instagram and phone remain optional. Instagram usernames accept an optional `@` and up to 30 unaccented letters, numbers, periods, or underscores; invalid values are explained inline before save. New phone input uses a Brazilian mask and accepts pasted Brazilian values, including `+55`; a non-empty number must contain 10 digits (fixed line) or 11 (mobile). Existing saved phone text is preserved until edited, and incomplete legacy numbers are flagged in the members list. Contact values are trimmed before submission, and server field details are surfaced instead of a generic validation message.
- Gatherings with a scheduled local date/time before the browser's current time are displayed under **Encontros realizados**, including when created with a past date/time. After a successful event save, the list is reclassified immediately; it is also reclassified every 30 seconds and when the page regains focus. This is a derived view and does not mutate the event record. Canceled gatherings remain in their own section.
- Gathering descriptions are optional, up to 2,000 characters. Optional poster uploads accept PNG, JPEG, and WebP images up to 1 MB; image bytes are stored separately from event metadata and fetched through the authenticated artwork endpoint.
- The events view groups upcoming, completed, and canceled gatherings into responsive artwork cards. Each preview reserves its frame while loading and labels missing or unavailable artwork; the card keeps its status, title, description, date, time, location, and attendance action visible. Upcoming gatherings can be edited or canceled; completed gatherings can be edited or permanently deleted after confirmation. Deleting a completed gathering also deletes its attendance records and artwork.
- Mutations are pessimistic; success is announced only after the API confirms it. A single pending flag prevents duplicate submissions.
- Member deletion, event cancellation, and completed event deletion use a named confirmation dialog. Deletion is permanent; database constraints may prevent removing a member with linked attendance. Deleting a completed event also removes its linked attendance and artwork. Event cancellation retains the event and disallows new attendance.
- Only the master can edit or delete common coordinator accounts. The master account is protected in both the interface and API. A new password is optional when editing; changing it invalidates previously issued sessions, and deleting an account immediately prevents its tokens from authenticating.
- API failures remain visible in the workspace; successful actions use a polite `role=status` toast that can be dismissed.
- Loading uses indeterminate progress and does not display invented percentages.
- No bulk selection, offline queue, optimistic mutation, or draft autosave is supported.

## Verification

- **Locale:** Brazilian Portuguese, with `pt-BR` dates and local event times.
- **Responsive widths:** Event cards use up to three columns on wide screens, two on tablet, and one on phone; navigation and attendance controls remain reachable.
- **Runtime source:** `frontend/src/style.css` owns CSS variables and component recipes; `DESIGN.md` documents approved values and intent.
- **Behavior matrix:** login/session expiry, list/search/empty states, editor validation/save/failure, delete/cancel confirmation, attendance add/remove, history load/error, Escape/focus restoration, reduced motion, and mobile navigation.
