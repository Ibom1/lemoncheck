# Roadmap

lemoncheck helps people inspect a used car and turn what they find into a fair offer. It runs in the browser, stores no personal details, and sends nothing anywhere.

## Status

| Milestone | Status | Estimate |
|---|---|---|
| v0.1 Checklist, score, verdict, offer, compare | ✅ done | |
| v0.2 Better on the lot | not started | 8–11 h |
| v0.3 Costs that fit the car | not started | 7–9 h |
| v0.4 Share and keep | not started | 8–11 h |
| v1.0 Ready for everyone | not started | 6–9 h |
| **Total planned** | | **29–40 h** |

Each item below is sized to be one or two commits.
Estimates include implementation, testing offline and mobile behavior, and verifying that older inspections still open.

## Principles

1. **No personal data.** No fields for sellers, plates or VINs; nothing leaves the device.
2. **Explain every number.** The score, verdict, costs and offer each say where they came from.
3. **Never overrule a mechanic.** The app helps buyers decide whether a car is worth a professional inspection; it doesn't replace one.
4. **The engine stays pure.** Logic lives in `src/engine/` with tests; components only display it.
5. **Use made-up sample data only.** All examples, demos, screenshots, and tests use fictional data. Never include real personal or customer data.

---

## ✅ v0.1: Checklist, score, verdict, offer, compare

- [x] 31 checks in six sections with "How to check" tips
- [x] Follow-up checks that appear and disappear with their trigger answer
- [x] Weighted condition score; Can't check left out
- [x] Verdict with deal-breakers and caps for major faults and repair share of price
- [x] Repair estimate, suggested offer, mileage check, real cost
- [x] Compare page ranked by real cost
- [x] Copy summary; localStorage with defensive loading
- [x] "Try a demo" with three made-up sample cars
- [x] 33 unit tests for the engine, storage and demo data; CI on Node 20 / 22 / 24 with `npm ci`

## v0.2: Better on the lot (8–11 h)

- [ ] **Live site** on Vercel, linked from the README and the repo sidebar

- [ ] **Works offline** as an installable app (PWA with a service worker), since car lots often have poor signal
- [ ] **Resume where you left off:** open the first unanswered item, not just the first unfinished section
- [ ] **Quick mode:** a 12-item shortlist for a first look before a full inspection
- [ ] **"Mark the rest good"** button per section, with an undo
- [ ] **Component tests** with React Testing Library for the rating control, follow-ups and the report
- [ ] Keyboard shortcuts on desktop (G / W / P / S to rate the focused item)

**Done when:** the app loads with the network off after one visit, quick mode produces a verdict from 12 answers, and the new components have tests.

## v0.3: Costs that fit the car (7–9 h)

- [ ] **Car class:** compact, SUV/truck, luxury, EV; each scales repair costs (luxury parts cost more)
- [ ] **EV and hybrid checklist:** hide oil and exhaust items; add battery health, charging port and cable, and regenerative braking checks
- [ ] **Edit a cost range** for one item in one inspection when you have a real quote
- [ ] **Currency setting** (CAD, USD, GBP, EUR) for display
- [ ] Tests for every scaling rule and for the EV checklist's visible items

**Done when:** the same issue costs more on a luxury car than a compact in a test, an EV inspection shows no oil change, and a custom quote replaces the estimate in the offer.

## v0.4: Share and keep (8–11 h)

- [ ] **Export and import** an inspection as a JSON file, validated with the same cleaning as storage
- [ ] **Printable report** page laid out for paper or PDF from the browser
- [ ] **Photos per item** stored in IndexedDB on the device only, never uploaded, with a reminder not to photograph licence plates or people
- [ ] **Shareable read-only link** that encodes the report in the URL hash (no server)

**Done when:** an export → import round trip gives an identical inspection, photos survive a reload, and a shared link opens the report without the original device.

## v1.0: Ready for everyone (6–9 h)

- [ ] Accessibility pass: screen reader labels, focus order, contrast checked in both themes
- [ ] End-to-end test of a full inspection in a browser (Playwright)
- [ ] Storage version 2 with a tested upgrade from version 1
- [ ] CHANGELOG and semantic versioning

## Out of scope

- Seller details, licence plates, VINs or locations
- Accounts, a backend, or listing scrapers
- Diagnosing faults or replacing a mechanic's pre-purchase inspection
