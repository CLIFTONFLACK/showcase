# IBD Malnutrition Calculator — Design Brainstorm

## Context
A clinical self-screening tool for IBD patients. The audience is people living with a chronic illness who may be anxious, fatigued, or in pain. The design must feel trustworthy, calm, and empowering — not clinical and cold, nor overly cheerful. The tool must be embeddable in a WordPress site via iframe, so it must be fully self-contained, responsive, and work at any width.

---

<response>
<probability>0.07</probability>
<text>
## Idea A — "Clinical Warmth" (Evidence-Based Calm)

**Design Movement:** Modern Medical / Biophilic Minimalism

**Core Principles:**
1. Calm authority — the interface should feel like a trusted specialist's office, not a government form
2. Progressive disclosure — reveal complexity only as needed; each step is a single focused question
3. Generous whitespace as a signal of care and thoughtfulness
4. Warm neutrals over sterile whites to reduce clinical anxiety

**Color Philosophy:**
- Background: warm off-white `#F8F5F0` — evokes paper, warmth, safety
- Primary: deep teal `#1A6B6B` — medical authority without coldness
- Accent: amber `#D4874A` — warmth, energy, calls to action
- Risk levels: sage green / amber / terracotta (avoids alarming red)
- Text: near-black charcoal `#2C2C2C`

**Layout Paradigm:**
- Single-column centered card, max-width 680px, designed for iframe embedding
- Progress bar at top (thin, teal)
- Each "step" occupies the full card — one question at a time
- Results page uses a two-column split: score/gauge left, recommendations right

**Signature Elements:**
1. Subtle leaf/organic SVG motif in card corners — biophilic, non-clinical
2. Animated step transitions (slide left/right)
3. Score gauge: a semicircular arc gauge in the results

**Interaction Philosophy:**
- Clicking an answer immediately advances to the next step (no "Next" button for single-choice questions)
- Smooth, unhurried transitions (300ms ease)
- Micro-feedback on hover: card options lift slightly

**Animation:**
- Step entry: fade-in + slight upward translate (200ms)
- Progress bar: smooth fill animation
- Results: score counter animates up to final value

**Typography System:**
- Headings: `Lora` (serif) — warm, authoritative, medical-journal feel
- Body: `Source Sans 3` — highly legible, neutral, clinical-friendly
- Scale: 28px heading / 16px body / 13px labels
</text>
</response>

<response>
<probability>0.06</probability>
<text>
## Idea B — "Data-Forward Clarity" (Scientific Dashboard)

**Design Movement:** Scientific Data Visualization / Bauhaus Functionalism

**Core Principles:**
1. Every element earns its place — ruthless reduction of decoration
2. Data is the hero — typography and layout serve the numbers
3. Structured grid creates implicit trust
4. High contrast for accessibility

**Color Philosophy:**
- Background: pure white `#FFFFFF` with `#F4F6F9` section fills
- Primary: cobalt blue `#2563EB` — scientific, precise, digital health
- Accent: coral `#F05A28` — alerts, high-risk indicators
- Neutral grays for secondary text
- Risk: green `#16A34A` / yellow `#CA8A04` / red `#DC2626`

**Layout Paradigm:**
- Left sidebar shows step navigation (numbered list, persistent)
- Right main area shows current question
- Results page: full dashboard with charts, score breakdown table, recommendations panel

**Signature Elements:**
1. Numbered step indicators in a vertical timeline on the left
2. Recharts radar/bar chart for score breakdown on results
3. Monospaced score display in results

**Interaction Philosophy:**
- Users can jump back to any previous step via sidebar
- All questions visible on one scrollable page (no step-by-step)
- Submit button at bottom

**Animation:**
- Sidebar step highlight transitions
- Chart bars animate in on results load
- Smooth scroll to results

**Typography System:**
- Headings: `DM Sans` (geometric sans)
- Body: `DM Sans` regular
- Monospace: `JetBrains Mono` for scores/numbers
</text>
</response>

<response>
<probability>0.05</probability>
<text>
## Idea C — "Empathetic Journey" (Patient-Centered Storytelling)

**Design Movement:** Human-Centered Design / Conversational UI

**Core Principles:**
1. The calculator feels like a conversation, not a form
2. Language is warm, first-person, and non-judgmental
3. Visual metaphors reinforce the journey narrative
4. Results feel like a personal letter, not a medical report

**Color Philosophy:**
- Background: soft lavender-grey `#F0EDF5`
- Primary: plum `#6B3FA0` — empathy, healing, calm authority
- Accent: soft gold `#C9A84C`
- Progress: gradient from plum to teal
- Risk: soft pastels (no alarming colors)

**Layout Paradigm:**
- Full-bleed card with illustrated header zone
- Conversational bubbles for questions (chat-like)
- Results: narrative paragraph first, then data breakdown below

**Signature Elements:**
1. Illustrated avatar/mascot (abstract, not cartoonish) in header
2. Chat-bubble style question cards
3. Results page opens with a personalized paragraph summary

**Interaction Philosophy:**
- Typing animation for question text (simulates conversation)
- Answers appear as "sent" messages
- Gentle confetti or positive micro-animation on completion

**Animation:**
- Question text types in character by character
- Answer cards slide up from bottom
- Results page fades in with a gentle bloom effect

**Typography System:**
- Headings: `Nunito` (rounded, friendly)
- Body: `Nunito` regular
- Accent: `Playfair Display` for the results summary paragraph
</text>
</response>

---

## Selected Approach: **Idea A — "Clinical Warmth"**

This approach best balances clinical credibility with patient-centered warmth. The step-by-step single-question format reduces cognitive load for users who may be unwell. The warm color palette and serif typography signal trustworthiness without feeling cold or bureaucratic. The semicircular gauge and animated results provide clear, satisfying feedback.
