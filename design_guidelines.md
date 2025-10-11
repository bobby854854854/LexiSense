# LexiSense CLM Platform - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design + Modern Enterprise SaaS)

**Justification:** LexiSense is an information-dense, utility-focused enterprise platform where efficiency, trust, and professional credibility are paramount. Drawing from Material Design's data-rich component patterns combined with the clean aesthetics of modern B2B SaaS leaders like Linear, Notion, and Salesforce Lightning.

**Key Design Principles:**

- **Institutional Trust:** Professional, secure, enterprise-grade visual language
- **Information Clarity:** Strong hierarchy for data-heavy interfaces
- **Efficiency-First:** Minimize cognitive load, maximize productivity
- **Intelligent Simplicity:** Sophisticated features presented accessibly

## Core Design Elements

### A. Color Palette

**Primary Brand Colors:**

- Primary (Brand): 216 85% 35% (Deep professional blue - trust, security)
- Primary Light: 216 85% 45%
- Primary Dark: 216 85% 25%

**Neutrals (Dark Mode Optimized):**

- Background: 220 15% 8%
- Surface: 220 13% 12%
- Surface Elevated: 220 12% 16%
- Border: 220 10% 25%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%
- Text Muted: 0 0% 45%

**Semantic Colors:**

- Success: 145 65% 45%
- Warning: 38 90% 55%
- Error: 358 75% 55%
- Info: 200 85% 55%

**Accent (Use Sparingly):**

- Accent: 270 70% 60% (Purple for AI features, premium indicators)

### B. Typography

**Font Families:**

- Primary: 'Inter' (via Google Fonts) - Clean, professional, excellent readability
- Monospace: 'JetBrains Mono' (for contract text, code snippets, data fields)

**Type Scale:**

- Display: text-5xl font-bold (Dashboard headings)
- H1: text-3xl font-semibold (Page titles)
- H2: text-2xl font-semibold (Section headers)
- H3: text-xl font-semibold (Subsections)
- Body: text-base (Main content)
- Small: text-sm (Labels, metadata)
- Tiny: text-xs (Captions, timestamps)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24

- Tight spacing: p-2, gap-2 (compact tables, data displays)
- Standard: p-4, gap-4, m-4 (cards, form fields)
- Generous: p-8, gap-8 (page sections, dashboard panels)
- Section breaks: py-12, py-16, py-24

**Grid Structure:**

- Dashboard: 12-column grid with sidebar navigation (240px fixed width)
- Content max-width: max-w-7xl (main content areas)
- Form max-width: max-w-2xl (optimal form completion)
- Full-width tables and data views where appropriate

### D. Component Library

**Navigation:**

- Fixed left sidebar (240px) with collapsible sections
- Top header bar with global search, notifications, user menu
- Breadcrumb navigation for deep hierarchies
- Tab navigation for multi-view pages

**Core UI Elements:**

- Cards: Rounded-lg (8px), shadow-sm, with subtle borders
- Buttons: Primary (filled), Secondary (outline), Ghost (text only)
- Forms: Floating labels, inline validation, helper text
- Tables: Striped rows, sortable headers, inline actions, pagination
- Badges: Rounded-full for status indicators (Active, Expired, Pending)

**Data Displays:**

- Dashboard widgets: Stats cards with icon, metric, change indicator
- Charts: Clean, minimal axis lines using Chart.js or Recharts
- Progress indicators: Linear and circular for completion tracking
- Timeline views: Vertical timeline for contract lifecycle stages

**Specialized Components:**

- Document Viewer: Split-pane with contract on left, AI insights on right
- AI Interaction Panel: Chat-like interface for AI Co-pilot
- Risk Indicators: Traffic light system (red/yellow/green) with severity levels
- Clause Library: Searchable card grid with preview

**Overlays:**

- Modals: Centered, max-w-2xl, backdrop blur
- Slide-overs: Right-side panel for quick actions (480px width)
- Tooltips: Dark bg, white text, small arrow, concise text
- Dropdowns: Subtle shadow, clean dividers

### E. Animations

**Use Extremely Sparingly:**

- Loading states: Subtle pulse on skeleton screens
- Transitions: 150ms ease for hover states only
- No scroll animations, parallax, or complex motion
- Focus on instant feedback for user actions

## Page-Specific Guidance

**Dashboard (Landing after login):**

- Hero stats row: 4 metric cards (Active Contracts, Expiring Soon, AI Assists, Cost Savings)
- Primary content: 2-column grid (Recent Contracts table left, Upcoming Actions sidebar right)
- Secondary: Contract value chart, Risk distribution chart
- Quick actions bar at top

**Contract Repository:**

- Filter sidebar (left): Search, date ranges, status, type, assignee
- Main content: Data table with sortable columns, bulk actions
- List/Grid toggle view
- Batch operations toolbar when items selected

**AI Contract Drafting:**

- Clean, focused interface
- Left: Form inputs for contract parameters
- Right: Live preview pane with AI-generated contract
- Bottom: Suggestion chips for AI improvements
- Floating action buttons for Save, Export, Send for Review

**Analytics & Reporting:**

- Dashboard-style layout
- Filter controls at top
- Chart cards in responsive grid (2-col on desktop, 1-col mobile)
- Export functionality prominent
- Date range selector

## Images

**Hero Image:** No large hero image needed - this is a utility application focused on dashboard functionality. The login/marketing pages (if separate) can have abstract geometric patterns or subtle contract/document imagery in the background with low opacity.

**Icon Usage:** Heroicons (outline style for navigation, solid for indicators)

**In-App Imagery:**

- Empty states: Simple illustrations (not photos) showing the feature value
- Profile avatars: Circle crop, initials fallback
- Document thumbnails: PDF-style previews
- AI feature badges: Sparkle/star icon indicators

This professional, data-centric design will convey enterprise credibility while maintaining modern usability standards expected in B2B SaaS applications.
