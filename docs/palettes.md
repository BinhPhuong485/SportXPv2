# SportXP Palette Comparison & Token Specifications

This document records the 3 palette candidates evaluated during the UI/UX polish session, including their contrast ratios and token values across Light and Dark themes.

---

## 1. Chosen Brand Palette: Candidate 1 — "Court Emerald" (Active)

**Rationale:** SportXP is an athletic platform dedicated to badminton matchmaking and tournament rankings. Court Emerald (`#176344` in light, `#00D665` in dark) evokes vibrant tournament turf, pristine indoor court mats, and crisp white tramlines. It delivers maximum athletic punch while exceeding all WCAG AA requirements.

### Light Theme (`:root`)
| Token Name | RGB Values | Hex Equivalent | Role | Contrast on Bg (`#F2F7F3`) | Contrast on Surface (`#FFFFFF`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-bg` | `242 247 243` | `#F2F7F3` | Canvas background | — | — |
| `--color-surface` | `255 255 255` | `#FFFFFF` | Bento cards, sheets | 1.08:1 | — |
| `--color-border` | `223 233 225` | `#DFE9E1` | Card and component borders | 1.15:1 | 1.25:1 |
| `--color-primary` | `23 99 68` | `#176344` | Brand hero, primary buttons | **6.67:1** (AAA) | **7.23:1** (AAA) |
| `--color-accent` | `41 154 99` | `#299A63` | Interactive links, badges | 3.29:1 (non-text) | 3.56:1 |
| `--color-mint` | `221 242 227` | `#DDF2E3` | Badge container tint | 1.17:1 | 1.27:1 |
| `--color-text` | `20 37 29` | `#14251D` | High-contrast body text | **14.77:1** (AAA) | **16.00:1** (AAA) |
| `--color-muted` | `97 115 106` | `#61736A` | Subtitles, labels, venue | **4.65:1** ($\ge 4.5:1$) | **5.04:1** ($\ge 4.5:1$) |
| `--color-loss` | `190 18 60` | `#BE123C` | Match defeats, cancelled | **5.80:1** (AA) | **6.29:1** (AA) |
| `--color-streak` | `148 98 0` | `#946200` | Winning streak, amber gold | **4.84:1** ($\ge 4.5:1$) | **5.24:1** ($\ge 4.5:1$) |
| `--color-event-hosting` | `23 99 68` | `#176344` | Calendar host event | **6.67:1** | **7.23:1** |
| `--color-event-joined` | `13 122 104` | `#0D7A68` | Calendar joined event | **4.84:1** | **5.25:1** |
| `--color-event-waitlist` | `180 83 9` | `#B45309` | Calendar waitlist event | **4.63:1** | **5.02:1** |
| `--color-event-tournament` | `109 40 217` | `#6D28D9` | Calendar tournament | **6.55:1** | **7.10:1** |
| `--color-event-cancelled` | `190 18 60` | `#BE123C` | Calendar cancelled event | **5.80:1** | **6.29:1** |

### Dark Theme (`:root[data-theme="dark"]`)
| Token Name | RGB Values | Hex Equivalent | Role | Contrast on Bg (`#07080A`) | Contrast on Surface (`#111317`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-bg` | `7 8 10` | `#07080A` | Deep Obsidian | — | — |
| `--color-surface` | `17 19 23` | `#111317` | Graphite card surface | 1.08:1 | — |
| `--color-border` | `27 31 38` | `#1B1F26` | Dark Slate hairlines | 1.18:1 | 1.10:1 |
| `--color-primary` | `0 214 101` | `#00D665` | Athletic Neon Green | **10.31:1** (AAA) | **9.57:1** (AAA) |
| `--color-accent` | `0 232 114` | `#00E872` | Electric Accent | **12.20:1** (AAA) | **11.32:1** (AAA) |
| `--color-mint` | `13 46 28` | `#0D2E1C` | Deep Pine badge tint | 1.55:1 | 1.44:1 |
| `--color-text` | `255 255 255` | `#FFFFFF` | Crisp White | **20.04:1** (AAA) | **18.59:1** (AAA) |
| `--color-muted` | `126 134 149` | `#7E8695` | Muted Slate metadata | **5.47:1** (AA) | **5.07:1** (AA) |
| `--color-loss` | `239 68 68` | `#EF4444` | Crimson Red | **5.32:1** (AA) | **4.94:1** (AA) |
| `--color-streak` | `245 166 35` | `#F5A623` | Amber Gold streak | **9.89:1** (AAA) | **9.17:1** (AAA) |
| `--color-event-hosting` | `0 214 101` | `#00D665` | Calendar host | **10.31:1** | **9.57:1** |
| `--color-event-joined` | `0 194 203` | `#00C2CB` | Calendar joined | **9.14:1** | **8.48:1** |
| `--color-event-waitlist` | `245 158 11` | `#F59E0B` | Calendar waitlist | **9.33:1** | **8.66:1** |
| `--color-event-tournament`| `167 139 250` | `#A78BFA` | Calendar tournament | **7.36:1** | **6.83:1** |
| `--color-event-cancelled` | `239 68 68` | `#EF4444` | Calendar cancelled | **5.32:1** | **4.94:1** |

---

## 2. Alternate Candidate 2: "Oceanic Jade & Navy"

**Concept:** Cooler prestige look with deep sea jade and icy white surfaces.

```css
/* To switch to Oceanic Jade, replace tokens in src/index.css with: */
:root {
  --color-bg: 241 245 249; /* #F1F5F9 */
  --color-surface: 255 255 255;
  --color-border: 218 226 237; /* #DAE2ED */
  --color-primary: 11 92 109; /* #0B5C6D */
  --color-accent: 14 116 144; /* #0E7490 */
  --color-accent-text: 11 92 109;
  --color-mint: 224 242 254; /* #E0F2FE */
  --color-text: 15 30 40; /* #0F1E28 */
  --color-muted: 85 104 119; /* #556877 */
  --color-loss: 190 24 93; /* #BE185D */
  --color-streak: 180 83 9; /* #B45309 */
  --color-gold: 245 158 11;
  --color-on-primary: 255 255 255;
  --color-court-dark: 9 32 40;
}
:root[data-theme="dark"] {
  --color-bg: 8 13 18; /* #080D12 */
  --color-surface: 16 25 35; /* #101923 */
  --color-border: 29 45 62; /* #1D2D3E */
  --color-primary: 6 182 212; /* #06B6D4 */
  --color-accent: 34 211 238; /* #22D3EE */
  --color-accent-text: 34 211 238;
  --color-mint: 12 43 62; /* #0C2B3E */
  --color-text: 248 250 252; /* #F8FAFC */
  --color-muted: 126 149 170; /* #7E95AA */
  --color-loss: 244 63 94; /* #F43F5E */
  --color-streak: 251 191 36; /* #FBBF24 */
  --color-gold: 251 191 36;
  --color-on-primary: 8 13 18;
  --color-court-dark: 9 32 40;
}
```

---

## 3. Alternate Candidate 3: "Cyber Pine & Acid Mint"

**Concept:** High-energy esports aesthetic with pitch-black dark mode and intense pine accents.

```css
/* To switch to Cyber Pine, replace tokens in src/index.css with: */
:root {
  --color-bg: 244 246 242; /* #F4F6F2 */
  --color-surface: 255 255 255;
  --color-border: 220 226 216; /* #DCE2D8 */
  --color-primary: 27 94 32; /* #1B5E20 */
  --color-accent: 46 125 50; /* #2E7D32 */
  --color-accent-text: 27 94 32;
  --color-mint: 232 245 233; /* #E8F5E9 */
  --color-text: 26 36 27; /* #1A241B */
  --color-muted: 92 107 94; /* #5C6B5E */
  --color-loss: 185 28 28; /* #B91C1C */
  --color-streak: 161 98 7; /* #A16207 */
  --color-gold: 245 158 11;
  --color-on-primary: 255 255 255;
  --color-court-dark: 8 35 15;
}
:root[data-theme="dark"] {
  --color-bg: 6 10 6; /* #060A06 */
  --color-surface: 17 24 18; /* #111812 */
  --color-border: 28 40 31; /* #1C281F */
  --color-primary: 16 185 129; /* #10B981 */
  --color-accent: 52 211 153; /* #34D399 */
  --color-accent-text: 52 211 153;
  --color-mint: 6 55 33; /* #063721 */
  --color-text: 255 255 255; /* #FFFFFF */
  --color-muted: 123 148 128; /* #7B9480 */
  --color-loss: 239 68 68; /* #EF4444 */
  --color-streak: 245 158 11; /* #F59E0B */
  --color-gold: 245 158 11;
  --color-on-primary: 6 10 6;
  --color-court-dark: 8 35 15;
}
```
