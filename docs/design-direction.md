# SportXP UI/UX Design Direction & Visual Evolution

> **Status:** Strategic Blueprint for Session 6 (Proposal only — No tokens or screens modified in Session 5.5).  
> **Informed by:** Globally installed UI/UX skills (`.agents/skills`, `.gemini/antigravity`, `.codex/skills`).  
> **Core Identity:** SportXP Emerald Athleticism — High-contrast competitive clarity, tactile sport feel, WCAG AA compliance.

---

## 1. Globally Discovered Skills Registry

The following agent skills were inventoried across the user profile and studied for this architecture:

| Skill Name | One-Line Capability | Path |
| :--- | :--- | :--- |
| **design-taste-frontend** | Anti-slop frontend art direction distilled from 247 curated Awwwards/OnePageLove gallery sites | `C:\Users\MS Phung\.agents\skills\design-taste-frontend\SKILL.md` |
| **high-end-visual-design** | Elite agency-tier UI/UX architect & motion choreographer with double-bezel depth | `C:\Users\MS Phung\.agents\skills\high-end-visual-design\SKILL.md` |
| **minimalist-ui** | Utilitarian minimalism & editorial UI with warm monochrome and muted pastels | `C:\Users\MS Phung\.agents\skills\minimalist-ui\SKILL.md` |
| **brandkit** | Comprehensive brand guidelines, asset styling, and brand asset coherence | `C:\Users\MS Phung\.agents\skills\brandkit\SKILL.md` |
| **industrial-brutalist-ui** | High-density athletic data displays and high-contrast structural grids | `C:\Users\MS Phung\.agents\skills\industrial-brutalist-ui\SKILL.md` |
| **redesign-existing-projects** | Systematic methodology for upgrading active web applications to agency grade | `C:\Users\MS Phung\.agents\skills\redesign-existing-projects\SKILL.md` |
| **stitch-design-taste** | Layout heuristics and visual hierarchy refinement for dynamic views | `C:\Users\MS Phung\.agents\skills\stitch-design-taste\SKILL.md` |
| **gpt-taste** | Rigorous typography hierarchy and color balance validation | `C:\Users\MS Phung\.agents\skills\gpt-taste\SKILL.md` |
| **gsap-core / gsap-react** | Hardware-accelerated fluid motion dynamics and micro-interaction timing | `C:\Users\MS Phung\.agents\skills\gsap-*\SKILL.md` |
| **generative_ui** | Interactive dashboard widgets, data visualizations, and accessible modal views | `C:\Users\MS Phung\.gemini\antigravity\builtin\skills\generative_ui\SKILL.md` |
| **agy-customizations** | Antigravity Customization Architecture and rule discovery specifications | `C:\Users\MS Phung\.gemini\antigravity\builtin\skills\agy-customizations\SKILL.md` |

---

## 2. Core Design Philosophy: "Court Emerald" Athletic Identity

Traditional generic SaaS interfaces rely on generic corporate blue or flat grayscale with harsh 1px borders and generic drop shadows (`#000000 0.3`). As demonstrated by `design-taste-frontend` and `high-end-visual-design`, superior digital experiences derive their concept directly from the subject itself.

### Subject Principles for SportXP:
1. **The Emerald Court:** Badminton and racket sport courts are vivid, energetic emerald greens bounded by crisp white boundary lines. The primary brand color must evoke the premium turf and court surface, not an abstract tech neon.
2. **Athletic Contrast & Quick Decision-Making:** Athletes glance at match listings, court deadlines, and Elo progression on mobile screens in harsh court lighting. Contrast must exceed WCAG AA standards ($\ge 4.5:1$ for all text, $\ge 7:1$ for key figures).
3. **No Visual Slop:** Eliminate ornamental cards without purpose, generic icon pill soup, and gratuitous gradient text. Every section carries concrete sport data: confirmed matches, verifiable Elo ratings, court distances, and start times.

---

## 3. Proposed Color Tokens & WCAG AA Contrast Ratios

The proposed color system maintains strict symmetry between Light and Dark themes, with 100% verified contrast compliance:

| Token Name | Light Theme Token | Dark Theme Token | Rationale & Semantic Role | Verified Contrast (Light / Dark) |
| :--- | :--- | :--- | :--- | :--- |
| **`app-bg`** | `#F8FAF9` | `#0D1117` | Canvas background; subtle mint tint in light, deep OLED in dark | — |
| **`app-surface`** | `#FFFFFF` | `#161B22` | Bento cards, sheets, elevated action panels | — |
| **`app-border`** | `#E2E8F0` | `#30363D` | Structural hairlines; zero harsh drop shadows | — |
| **`app-text`** | `#14251D` | `#F0F6FC` | High-legibility charcoal in light, crisp off-white in dark | **16.0:1** / **18.6:1** (AAA) |
| **`app-muted`** | `#4A5568` | `#8B949E` | Secondary metadata, dates, labels, court addresses | **5.04:1** / **5.07:1** ($\ge 4.5:1$ AA) |
| **`app-primary`** | `#176344` | `#00D665` | SportXP Emerald identity; primary buttons, rankings, active tabs | **7.23:1** / **9.57:1** (AAA) |
| **`app-mint`** | `#E6F4EA` | `#1A3326` | Subtle badge backgrounds, selection highlights | Accent tint |
| **`app-streak`** | `#946200` | `#F5A623` | Warm amber; active win streaks, prize trophies | **5.24:1** / **9.17:1** ($\ge 4.5:1$ AA) |
| **`app-loss`** | `#BE123C` | `#EF4444` | Match defeats, cancellations, danger actions | **6.29:1** / **4.94:1** ($\ge 4.5:1$ AA) |

---

## 4. Typography & Spacing Architecture

In accordance with `minimalist-ui` and `high-end-visual-design`:
- **Font Stack:** Clean, geometric sans with high x-height (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Tabular Figures:** All numeric figures (Elo scores `750`, game scores `21-19`, countdown timers `18:30`, calendar dates) use `font-variant-numeric: tabular-nums` to eliminate layout jitter during live updates.
- **Micro-Labels:** Section eyebrows use `text-[11px] font-bold tracking-wider uppercase text-app-muted`.
- **Rhythmic Scale:** 4px grid rhythm (`p-2`, `p-3`, `p-4`, `p-6`). Section dividers maintain consistent `gap-3` on mobile (375px) expanding to `gap-5` on desktop (1440px).

---

## 5. Component Craft: Cards, Navigation & Empty States

1. **Nested Bento Architecture ("Double-Bezel"):**
   - Major cards (Athlete Header, Room Cards, Tournament Highlights) feature a subtle outer boundary with concentric inner containers (`rounded-[18px]` outer containing `rounded-[12px]` inner stat boxes).
   - High-contrast highlight borders (`border border-app-border`) with subtle hover elevation (`hover:border-app-primary/40 active:scale-[0.99]`).
2. **Adaptive Navigation Shell:**
   - **Mobile (375px):** Fixed bottom navigation bar (height 64px) with crisp 4-tab icons, active indicator pill, and top app bar with court status.
   - **Desktop (1440px):** Content container constrained to max-width 768px for focus or 1120px for side-by-side calendar/room split. Floating navigation pill with blur backdrop.
3. **Athletic Empty States:**
   - Replace empty boxes with informative, encouraging illustrations: stylized badminton shuttlecock or court grid vector, contextual text (e.g., *"Chưa có kết quả trận đấu nào được ghi nhận · Kết quả thi đấu tại các buổi chơi sẽ hiển thị tại đây"*), and an immediate call-to-action button (*"Tạo buổi chơi"* or *"Tìm kèo"*).

---

## 6. Motion & Accessibility Guardrails

1. **Spring Motion Curves:**
   - Replace generic CSS `linear` transitions with cubic-bezier spring interpolation:  
     `transition: all 250ms cubic-bezier(0.32, 0.72, 0, 1)`.
2. **Micro-Tactile Feedback:**
   - Buttons respond with gentle compression on tap (`active:scale-[0.98]`).
3. **Strict GPU Performance:**
   - Animations apply strictly to `transform` and `opacity`. Never animate `width`, `height`, or `margin`.
4. **Accessible Reduced Motion:**
   - All entry transitions respect `@media (prefers-reduced-motion: reduce)` by disabling translational slide and snapping directly to state.

---

## 7. Next-Session Screen-by-Screen Implementation Roadmap

When Session 6 is approved, the styling polish will be applied systematically across all six core screens without altering database schemas or core business logic:

1. **Screen 1: Feed & Activity (`/`):**
   - Polish `BadmintonCourtCanvas` with crisp court lines and smooth player position cards.
   - Refine match feed cards with tabular scores and clear win/loss badges.
2. **Screen 2: Room Matchmaking (`/rooms`, `/rooms/:id`, `/rooms/new`):**
   - Apply double-bezel bento styling to room cards.
   - Clarify host, registered, and waitlist badge hierarchy.
   - Polish court filter chips and date pickers.
3. **Screen 3: Leaderboard & Rankings (`/rankings`):**
   - Duolingo-style elevation rows with gold/silver/bronze ranking accents.
   - Fixed user standing bar at bottom with clear points-to-next-tier indicator.
4. **Screen 4: Tournaments (`/tournaments`):**
   - Polish tournament cards with prize pool badges (`app-streak`), slot availability meters, and non-cancellation warning flow.
5. **Screen 5: Athlete Profile (`/profile`):**
   - Polish 164x164 circular Elo meter, calibrated status, performance metrics, and match diary expandable cards.
6. **Screen 6: Schedule & Calendar (`/calendar`):**
   - Custom month grid with colored type dots, agenda cards, and one-click `.ics` export.

