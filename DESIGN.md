---
version: alpha
colors:
  primary: "#14143A"
  accent: "#B89867"
  background: "#F0F0F3"
  surface: "#FFFFFF"
  text: "#25253B"
  muted: "#696A7C"
  border: "#DEDEE5"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
  sans:
    fontFamily: "DM Sans, Segoe UI, sans-serif"
rounded:
  small: "2px"
  medium: "4px"
  large: "8px"
spacing:
  base: "4px"
components:
  navigation:
    background: "#14143A"
    activeMark: "#B89867"
  primaryButton:
    background: "#14143A"
    color: "#FFFFFF"
  journey:
    line: "#C9C8D2"
    stop: "#B89867"
---

## Overview

JSLG is the Portuguese-language coordination workspace for Jovens de São Luís Gonzaga. Coordinators keep member contacts, plan gatherings, and record attendance. The product should feel like a practical field notebook used by a real youth community: warm in voice, clear in its records, and rooted in the group's life rather than church clip art or generic SaaS furniture.

The signature is the **community path**: a fine brass line connects real upcoming gatherings in chronological order. It appears on the overview and informs attendance sequence without turning every screen into a timeline. The nearest gathering leads the overview; people and attendance stay central to their own pages. Use the supplied community logo and the motto “O Deus que me chama é amor.” as authentic brand material. Avoid repeated equal cards, oversized metric tiles, decorative religious symbols, and startup gradients.

The runtime source of design tokens is `frontend/src/style.css`; this file records the accepted values and rationale. CSS custom properties map the primary palette and semantic colors to shared UI rules. Typography and layout tokens use the same stylesheet. Keep this mapping in sync when changing the system.

## Colors

The pinned brand pair is `#14143A` (ink navy) and `#B89867` (brass). Navy anchors navigation, the next-gathering feature, headings, and primary actions. Brass marks the path, date details, and focused emphasis; it never carries small body copy when contrast would suffer. Cool mist `#F0F0F3` separates the workspace from white record surfaces. Text and borders use `#25253B` and `#DEDEE5`.

## Typography

Use Barlow Condensed for large page titles, dates, and compact editorial headings. Its narrow proportions give the coordination notebook a recognizable voice and preserve room for Portuguese. Use DM Sans for reading, tables, forms, metadata, and counts. Use weight, spacing, and tabular numerals to distinguish small labels; the interface has no monospace or utility typeface. Font stacks include local fallbacks; layout must remain stable if remote Google Fonts do not load.

## Layout

On wide screens, a fixed navy rail holds the group identity and four stable destinations. The white top strip carries the current date and refresh action. The workspace has a bounded reading column. On the overview, the next real gathering is one full-width navy band with its date set apart; subsequent dates follow a connected chronological path, while member count remains a quiet side note. The events page is an artwork-led collection of gathering cards, members use a comparison table, and attendance stays attached to its selected gathering.

Event date selection uses an authored Portuguese calendar rather than the browser's combined date-time popup. The month header, Monday-first weekday labels, selected day, today marker, disabled past dates, and separate local-time field follow the same navy and brass rules. At widths under 720px, replace the rail with a compact identity strip and labeled bottom navigation. Keep the gathering's date, title, location, and attendance action visible. Tables may scroll horizontally because their columns are meaningful comparisons. Forms, dialogs, and attendance controls stack without clipping. Keep Brazilian Portuguese copy and `pt-BR` date/time formats.

The event collection separates upcoming, completed, and canceled gatherings into responsive cards, with up to three columns on wide screens. Each card leads with a wide preview of the uploaded artwork, then shows status, title, optional description, date, time, location, and its attendance action. Missing artwork has a labeled placeholder; image loading keeps the preview space reserved.

## Elevation & Depth

Most static records use surface contrast and rules instead of floating cards. Event cards are the deliberate exception: their framed poster previews use a quiet border and shallow shadow so completed gatherings read as a visual archive. The navy gathering feature earns its own uninterrupted field; do not repeat that treatment on every section.

## Shapes

Keep the interface mostly square-edged: 2px fields, 4px buttons, 8px major overlay surfaces. Circles are for the supplied logo, member initials, and actual stops along the gathering path. Avoid pill navigation, ornamental circles, and nested cards.

## Components

The shared gathering editor includes optional description and poster fields. Poster previews use a wide, reserved frame with a restrained crop, matching the event-card collection; the edit form keeps its larger image preview.

Primary actions use navy with white text. Neutral actions use transparent or light surfaces with a clear border. Destructive actions are separated from routine actions and confirmed with the exact record named. Inputs keep visible labels. Event dates use the shared authored calendar with full keyboard navigation and the browser top layer; time and select controls remain native. Icons come from Lucide React and remain secondary to labels. The sidebar and mobile navigation are the same four destinations with one selected state and consistent order.

## Do's and Don'ts

- Preserve `#14143A` and `#B89867` as the primary brand colors.
- Use the real schedule to draw the community path; never invent events or attendance counts.
- Let the logo and supplied motto provide religious identity; do not add generic crosses, doves, or stock church imagery.
- Keep page headings, actions, form feedback, and empty states in sentence case and Brazilian Portuguese.
- Use rules, alignment, and type scale for hierarchy before adding another container.
- Maintain visible keyboard focus, reduced-motion support, and readable contrast at every viewport.
