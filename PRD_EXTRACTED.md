



PROJECT 2  •  TIER 02  •  P10


Prepaid Meter Recharge Advisor

Product Requirements Document
A deployment-ready web product for deterministic prepaid-meter simulation, recharge advising, and three-month recharge-habit comparison.
Product objectiveBuild a professional, user-friendly web application that satisfies all four required challenge items while strictly respecting the judge clarifications: recharge timing must not manufacture an energy-rate saving, “cost” must mean meter consumption (energy + VAT + applicable monthly fixed charges), and both comparison habits must use identical daily consumption and the same calendar-month slab counter.


Document
Value
Problem
P10 — Prepaid Meter Recharge Advisor
Primary input
Provided P10 JSON public cases plus the challenge tariff specification
Core product type
Web application + deterministic calculation API
Database
Not required for MVP; JSON-backed architecture recommended
Admin panel
Not required by the challenge
AI
Optional explanation layer only; never the source of numeric truth
Status
Implementation-ready PRD





1. Executive Summary
The Prepaid Meter Recharge Advisor is a calculation-first web application that turns a prepaid-electricity case into an explainable meter simulation. It reconstructs day-by-day balance, applies calendar-month slab pricing, applies the first-recharge monthly fixed charges and VAT according to the supplied tariff rules, predicts depletion, calculates the recharge needed to reach a target date, and compares two recharge habits over the same three months.
The product is intentionally deterministic. Every displayed amount and date must be traceable to the source readings, recharge events, tariff rules, and simulation state. The UI may use animation and 3D visual effects, but those visuals must never alter or obscure the calculation results.


Source-grounded constraints


The provided JSON defines the case schema and includes opening balance, consecutive daily readings, recharge history, today, usual daily usage, target date, and comparison parameters. The readings start on the first of a month, so the slab counter starts at zero each month. 


PUB-01 provides an example of the required case structure: opening balance 310 BDT, historical daily readings, recharge events, a target date, and comparison months April–June 2026.  


The comparison configuration explicitly supplies a low-balance threshold, low-balance recharge amount, and monthly recharge amount; these must drive the two strategy simulations. 


The JSON file is case data; the actual tariff table referred to as “tariff above” must be supplied from the challenge statement and treated as the authoritative tariff configuration. It must not be invented from the JSON.


PRD success definition


A judge can select a case and understand the current balance, forecast, target-date recharge, and habit comparison without manual calculation.


The numerical engine passes deterministic unit tests for slab boundaries, monthly resets, first-recharge fixed charges, VAT, recharges, depletion, and strategy comparison.


The interface looks polished and professional at desktop and mobile breakpoints, with restrained motion and purposeful 3D rather than visual clutter.


The application can be deployed without a database or admin panel for the hackathon MVP.


2. Problem Statement & Product Interpretation
The challenge asks the product to perform four required items. These four items are the product contract, not optional features.
Req.
Requirement
Product interpretation
R1
Create a household with at least six months of daily readings and recharge history; include a light month, a heavy summer month, and a month with a large recharge in the last week.
Case ingestion + validation + historical visualization. Public JSON cases can be loaded directly; the product should validate the required data characteristics.
R2
Rebuild the meter balance day by day using the tariff; charge each day’s units at the slab reached by the month’s running total; apply demand charge and meter rent on the first recharge of each month; add VAT; show balance as a line with every recharge marked.
Deterministic meter simulator + balance chart + transaction ledger.
R3
Answer depletion date and target-date recharge questions; break required recharge into energy, higher-slab effect, fixed charges, and VAT.
Advisor engine + forecast + transparent cost decomposition.
R4
Compare low-balance and monthly recharge habits over the same three months with the same consumption.
Two isolated simulations fed identical daily units and calendar-month slab counters; compare meter-consumed cost.




Judge-critical clarifications


Both recharge habits use identical daily consumption and the same calendar-month slab counter. Recharge timing cannot create an energy-rate saving.


“Cost” means money consumed by the meter: energy, VAT, and applicable monthly fixed charges. It is not the amount deposited.


The two strategy results may legitimately be equal. A difference can arise only from how many monthly first-recharge fixed charges occur; fabricated slab savings are a failure.


“Low balance” means recharge the case’s configured low-balance amount on the first day whose balance is below the configured threshold. “Monthly” means recharge the configured monthly amount on the first day of each configured month. Both strategies begin from the same opening balance and run the same three named months.


3. Goals, Non-Goals & Principles


Goals


Numerical correctness over visual novelty.


One source of truth for tariff and simulation logic.


Explainable outputs: every balance change and cost component can be inspected.


Fast case switching and instant recalculation.


Polished, accessible, responsive UX with restrained animation and 3D.


Deployment-ready without database or admin dependencies.


Non-goals


No user account system is required by the challenge.


No payment gateway or real-world recharge transaction is required.


No admin dashboard is required.


No ML model is required to generate the numeric forecast; the supplied usual daily units can drive deterministic future simulation.


No claim of utility-company tariff authority beyond the challenge’s supplied tariff specification.


Engineering principles


Pure functions for tariff and cost calculations.


Decimal/fixed-point money arithmetic; do not use binary floating-point for BDT totals.


Immutable simulation inputs; each strategy gets a fresh simulation state.


Calendar-month boundaries are explicit state transitions.


UI displays formatted results, never recomputes business rules.


4. Users & Primary User Journeys
Persona
Need
Key journey
Household user
Know balance, depletion date, and how much to recharge.
Select case → view balance → inspect forecast → enter/accept target date → see required recharge and breakdown.
Judge / reviewer
Verify that all challenge requirements are implemented.
Open case → inspect daily ledger → open strategy comparison → verify same consumption/slab basis → review exact cost difference.
Developer / maintainer
Trust the engine and diagnose edge cases.
Open simulation details → inspect inputs and tariff version → reproduce calculations from case data.




5. Product Scope & Information Architecture
Screen
Purpose
Must-have elements
Overview / Dashboard
Fast answer to “Where am I now?”
Current balance, last reading, usual daily units, depletion estimate, target-date recommendation, quick actions.
Meter Simulation
Audit the day-by-day calculation
Balance line chart, recharge markers, daily ledger, monthly slab counter, energy/fixed/VAT columns.
Recharge Advisor
Answer both family questions
Depletion date, target date input, required recharge, four-part breakdown, confidence/assumption note.
Habit Comparison
Compare the two mandated strategies
Three-month selector, identical-consumption notice, low-balance vs monthly cards, total meter cost, difference, explanation of fixed-charge-only variance.
Case / Data view
Show source data and validation
Case ID, opening balance, date range, recharge list, validation status, source information.




Navigation
Desktop: compact left navigation with Overview, Simulation, Advisor, Comparison, and Case Data. Mobile: bottom navigation or a collapsible menu. The active route should be visually distinct without bright neon UI.


6. Detailed Functional Requirements


FR-01 Case loading & validation

1.  Load a selected case from the provided JSON file.

2.  Validate required fields: case_id, opening_balance_bdt, days, recharges, today, usual_daily_units, target_date, comparison.

3.  Validate that dates are consecutive and readings begin on the first day of a month.

4.  Validate that comparison months exist in the case and that required recharge amounts/thresholds are present.

5.  Flag but do not silently “repair” malformed source data.


FR-02 Tariff configuration


Store the challenge tariff as versioned configuration (e.g., tariff_v1.json) separate from case data.


Represent unit slabs, demand charge, meter rent, VAT rule, and any other challenge-defined charge explicitly.


Do not hard-code tariff values inside UI components.


Expose tariff version and effective date in debug/details view so a judge can reproduce results.


FR-03 Daily slab calculation


Maintain a calendar-month running unit counter.


At the start of each calendar month, reset the running counter to zero.


Price each day’s units against the slab(s) reached by the monthly running total; if a day crosses a slab boundary, split the day’s units across the relevant slabs.


Recharge events must not reset the monthly slab counter.


FR-04 Recharge and fixed charges


Apply recharge amounts on their recorded dates in the historical simulation.


Apply demand charge and meter rent only on the first recharge of each calendar month, exactly as defined by the tariff specification.


Track “first recharge of month” as simulation state; later recharges in the same month do not trigger the monthly fixed charge again.


Keep deposited amount separate from meter-consumed cost.


FR-05 VAT calculation


Calculate VAT exactly according to the challenge tariff specification.


Display VAT as a separate component in the daily ledger and advisor breakdown.


Use money-safe arithmetic and defined rounding rules at the correct stage of calculation.


FR-06 Balance reconstruction


Start with opening balance before the first day.


For each day: apply any recharge event(s), calculate daily meter consumption, calculate applicable fixed charges and VAT, deduct meter-consumed cost, and persist the resulting balance.


Mark every recharge on the balance chart and transaction ledger.


Never allow UI rounding to change the underlying balance state.


FR-07 Depletion forecast


Start from the reconstructed balance at today.


Use the case’s usual_daily_units for future daily consumption unless the product explicitly exposes a what-if input.


Continue daily simulation into future dates using the same tariff engine and monthly reset logic.


Return the first date on which the balance is exhausted under the defined depletion convention.


Show assumptions: current balance date, daily units, tariff version, and whether future recharges are assumed absent.


FR-08 Target-date recharge


Simulate from today through the configured target date.


Determine the total future meter-consumed cost and compare it with today’s available balance.


If balance is sufficient, required recharge is zero.


If insufficient, required recharge equals the additional money that must be deposited today to keep the balance non-negative through the target date, following any challenge-defined rounding rule.


Break the result into energy cost, higher-slab effect, fixed charges, and VAT.


FR-09 Strategy comparison


Run the low-balance and monthly strategies over the exact same three comparison months.


Feed both simulations the exact same daily unit readings.


Feed both simulations the exact same calendar-month slab-counter behavior.


Apply the strategy-specific recharge event rules only to recharge timing/amount; never mutate consumption or slab progression to create savings.


Report energy, fixed charges, VAT, total meter cost, deposits/recharges, and net difference separately.


Allow an exact tie and display “Equal cost” rather than forcing a winner.


7. Output Specification
Output
Definition
UI treatment
Current balance
Latest simulated meter balance as of today.
Large primary KPI with date and status.
Depletion date
First future date at which projected balance is exhausted under stated assumptions.
Highlighted forecast KPI + chart marker.
Required recharge today
Additional amount needed to remain funded through target date.
Primary CTA-style result; breakdown beneath.
Energy cost
Meter-consumed energy charge from daily units/slabs.
Cost card + ledger column.
Higher-slab effect
Increment attributable to units priced above the baseline/lower slab basis used by the challenge breakdown.
Separate breakdown row with tooltip methodology.
Fixed charges
Applicable monthly first-recharge demand charge + meter rent.
Separate card/ledger column.
VAT
Tax amount calculated under the challenge rule.
Separate breakdown row.
Recharge/deposit
Amount added to meter balance; not itself a “cost”.
Separate transaction type and total.




8. UX / UI Design Requirements


Visual direction
The visual language should feel premium, technical, calm, and trustworthy. Avoid both extremes: no over-bright dashboard and no muddy/dull interface. Use a deep plum/navy foundation with warm neutral surfaces, an acid-lime or muted chart accent for attention, and warm gold only for secondary highlights. High-contrast text must remain readable.
Area
Requirement
Color
Primary: deep plum/navy. Surfaces: soft near-white or charcoal-plum. Accent: controlled lime/green for positive states. Secondary accent: muted gold. Avoid large saturated gradients.
Typography
Clean modern sans serif; strong hierarchy; tabular/monospaced numbers for balances and financial values.
Cards
Rounded but not playful; consistent border radius, subtle shadow, clear spacing.
Charts
Minimal grid, clear labels, hover tooltips, recharge markers, and a depletion/target marker.
Tables
Sticky headers on desktop; responsive card/table transformation on mobile.
3D
One hero 3D meter object or layered depth treatment; optional subtle depth on balance card. 3D must degrade gracefully on low-power devices.
Motion
Short, purposeful transitions: number count-up, chart draw-in, card reveal, hover depth. Respect reduced-motion preference.
Tone
Financially trustworthy; avoid gamification that could make money figures feel decorative.




Suggested hero experience
A stylized 3D prepaid meter cylinder/display sits behind a compact dashboard summary. Its visual state reflects balance health (normal / low / near-empty), while the actual numeric balance remains dominant and always readable. On page load, the 3D meter and KPI cards animate in once; after that, interactions remain fast and subtle.


9. Technical Architecture
Layer
Recommendation
Rationale
Frontend
React + Vite + TypeScript + Tailwind CSS. Recharts or another lightweight chart library.
Fast development, responsive UI, clear component boundaries.
Backend
FastAPI + Python.
Natural fit for deterministic financial calculations and easy JSON handling.
Data
Provided JSON cases + versioned tariff JSON.
No database required for MVP; reproducible inputs.
Persistence
None for MVP. Optional local export/download for results.
Avoid setup overhead and admin dependencies.
3D
Three.js / React Three Fiber or CSS 3D fallback.
Premium visual without requiring a separate 3D backend.
Deployment
Frontend on Vercel/Netlify/Cloudflare; backend on Render/Railway/Fly.io or similar.
Simple public demo deployment.




Backend modules


case_loader — schema validation and case normalization


tariff_engine — slab allocation, energy charges, fixed charges, VAT


meter_engine — chronological simulation and balance state


advisor_engine — depletion and target-date calculations


comparison_engine — low-balance and monthly strategy simulations


api — read-only calculation endpoints for the frontend


tests — boundary and regression suite


Recommended data contracts
Endpoint
Method
Purpose
/api/cases
GET
Return available case IDs and summary metadata.
/api/cases/{id}
GET
Return validated source case data.
/api/simulate/{id}
GET
Return historical daily ledger and reconstructed balance.
/api/advisor/{id}
GET
Return current balance, depletion forecast, and target-date requirement using case defaults.
/api/advisor/{id}/target
POST
Accept optional target date / usage scenario and return deterministic recharge analysis.
/api/compare/{id}
GET
Return three-month comparison for the two mandated strategies.
/api/tariff
GET
Return tariff version and effective rules used by the engine.




10. Data Model
The application should normalize source JSON into typed internal models. The provided schema includes the fields below. 
Entity
Fields
Notes
Case
case_id, opening_balance_bdt, days[], recharges[], today, usual_daily_units, target_date, comparison
Directly derived from supplied JSON.
DailyReading
date, units
Consecutive daily record; units are whole units.
Recharge
date, amount_bdt
May occur multiple times in a month; month’s first recharge triggers monthly fixed charges per tariff rule.
ComparisonConfig
months[], source, daily_units, opening_balance_bdt, low_threshold_bdt, low_amount_bdt, monthly_amount_bdt
Drives the three-month comparison. PUB-01, for example, uses April–June 2026 and configured threshold/amounts. 
DailyLedgerRow
date, units, monthly_running_units, recharge, energy_cost, fixed_charge, vat, total_cost, closing_balance
Derived simulation output.




11. Calculation Contract & State Rules
This section is intentionally strict because it is where most correctness failures can occur.


Simulation state


balance_bdt


calendar_month


monthly_running_units


first_recharge_applied_this_month


cumulative_meter_cost


cumulative_energy_cost


cumulative_fixed_charge


cumulative_vat


Daily processing order

1.  Detect calendar-month transition; reset monthly_running_units and first_recharge_applied_this_month state.

2.  Apply all recharge events dated for the current day to the balance/deposit ledger.

3.  If the current day contains the month’s first recharge, apply monthly fixed charges according to tariff and charge them to meter cost.

4.  Price the day’s units by the slab reached as the monthly running total advances across the current day.

5.  Compute VAT exactly per tariff rule and prescribed rounding stage.

6.  Deduct meter-consumed cost from balance.

7.  Increment monthly_running_units by the day’s units.

8.  Persist the closing balance and all component values in the daily ledger.
Critical invariantsRecharge changes balance but does not reset monthly slab units. Historical and comparison simulations must use the same unit readings for both strategies. A strategy must never receive a lower energy rate merely because it recharged earlier. Fixed monthly charges may differ only because the timing/count of first recharges differs.




12. Validation, Error Handling & Edge Cases
Case
Expected behavior
Recharge on first day of month
Apply first-recharge fixed charges once for that month.
Multiple recharges same day
Process all deposits; fixed charges trigger at most once for that month.
Recharge after balance would cross zero during a day
Follow the challenge’s defined day/recharge semantics; do not invent partial-day meter-credit rules. Make the adopted order explicit in docs/tests.
Day crosses slab boundary
Split the day’s units across slabs; do not price all units at the highest reached slab.
Month changes
Reset monthly running unit counter to zero before pricing the new month.
No recharge in a month
No first-recharge fixed charge is applied because there is no first recharge event.
Required recharge is negative
Clamp to zero; present “No additional recharge required.”
Two strategies tie
Display equal cost and BDT 0 difference.
Malformed source dates
Block simulation and explain the exact validation error.
Missing tariff configuration
Block numeric results; show “Tariff configuration unavailable” rather than guessing.
Large/very small BDT values
Use decimal arithmetic and fixed display precision according to the challenge rules.




13. Security, Performance & Reliability


Treat source JSON and tariff files as read-only application assets in the deployed MVP.


No secret API keys are required for the core product.


Validate all POST parameters server-side even if the UI validates them client-side.


Return structured error responses with stable error codes for frontend handling.


Avoid server-side mutable global simulation state; every request should be reproducible from explicit inputs.


Target sub-500 ms API response for a normal case on a warm instance; calculations are lightweight enough to run synchronously.


Lazy-load the 3D scene and chart libraries where possible so the initial app remains responsive.


14. Accessibility & Responsive Behavior


Meet WCAG-oriented contrast expectations for core text and controls.


Keyboard-focusable controls with visible focus indicators.


No information should rely on color alone; charts and statuses need text labels/icons.


Respect prefers-reduced-motion and provide a simplified visual mode.


All numeric KPIs must remain readable at 200% browser zoom.


Mobile layouts must preserve the order: current state → advisor result → breakdown → details.


15. Testing & Verification Plan


Unit tests — mandatory


Tariff slab boundary tests: exactly at boundary, one unit below, one unit above.


Day-crossing-boundary tests: a single day spans two or more slabs.


Month-reset tests: last day of month → first day of next month.


Recharge tests: first recharge vs later recharge within same month.


VAT tests against authoritative examples from the tariff specification.


Historical balance reconstruction tests for at least one complete public case.


Depletion date test with a hand-verified expected result.


Target-date recharge test with hand-verified expected result.


Comparison invariants: identical energy cost basis under identical readings/slab counters; difference only where fixed-charge occurrence differs.


Acceptance matrix
Acceptance ID
Pass condition
AC-R1
At least one public case loads with six+ months of daily readings and recharge history; data characteristics can be inspected.
AC-R2
Daily ledger reconstructs balance and visibly marks every recharge on the balance line.
AC-R3
Depletion date and target-date recharge are produced from deterministic simulation and include the four requested breakdown components.
AC-R4
Two three-month strategies run on identical daily units and identical calendar-month slab logic; the comparison never invents an energy-rate saving from recharge timing.
AC-J1
Recharge amount is clearly distinguished from meter-consumed cost.
AC-J2
A zero-cost difference can be shown without forcing a winner.
AC-UX1
Desktop and mobile layouts are polished, responsive, and readable.
AC-UX2
Animation and 3D enhance the experience without blocking access to numeric results and work with reduced motion.
AC-DEP1
Public URL loads successfully with no database or admin setup required.




16. Deployment & Environment
Component
Environment variables / assets
Frontend
VITE_API_BASE_URL; optional analytics disabled by default.
Backend
PORT; optional CORS_ORIGINS.
Data assets
public/cases/P10_prepaid_meter_public.json and versioned tariff configuration.
No required secrets
Core calculations do not require API keys.




Deployment checklist


Build frontend in production mode.


Deploy backend with health endpoint /health.


Verify CORS against production frontend origin.


Run smoke tests on all public cases.


Verify tariff version displayed matches deployed configuration.


Verify mobile and reduced-motion behavior.


Provide a short “How this calculation works” drawer for judges.


17. Hackathon Execution Plan
Phase
Priority
Deliverable
Phase 1
P0
Tariff config + JSON loader + typed models + slab/fixed/VAT functions.
Phase 2
P0
Historical meter simulation + daily ledger + balance chart.
Phase 3
P0
Depletion + target-date recharge advisor + breakdown.
Phase 4
P0
Three-month strategy comparison + judge clarification UI.
Phase 5
P1
Polished dashboard, responsive layouts, charts, interaction design.
Phase 6
P1
3D hero, micro-interactions, reduced-motion support.
Phase 7
P0
Unit tests, public-case regression tests, deployment and demo rehearsal.




2–3 hour MVP order

1.  Build and test calculation engine before UI polish.

2.  Expose 4–6 API endpoints.

3.  Build Overview + Advisor + Comparison first; Simulation and Case Data can follow.

4.  Add chart and one restrained 3D visual only after numerical correctness is locked.

5.  Deploy early, then run regression tests against the public cases.


18. Judge Demo Flow

1.  Open the app and select PUB-01.

2.  Show the current balance and historical usage trend.

3.  Open Simulation and point out that recharge markers sit on the balance curve while the monthly slab counter progresses independently.

4.  Open Advisor and show the depletion date and target-date recharge.

5.  Open the cost breakdown and distinguish energy, higher-slab effect, fixed charges, VAT, and deposit.

6.  Open Comparison and explicitly state: “Both strategies use the same daily readings and the same calendar-month slab counter; any difference comes from fixed-charge occurrence, not a fabricated energy-rate saving.”

7.  Show the exact difference; if the result is zero, display “Equal cost” rather than choosing a winner.

8.  Open the calculation-details drawer to show tariff version and assumptions.


19. Open Questions / Inputs Required Before Coding
Critical input still requiredThe uploaded P10 JSON contains the case schema and case data, but the actual tariff table referenced by the problem statement (“tariff above”) is not included in the JSON excerpt. Before implementing the numeric engine, load the authoritative tariff specification from the hackathon statement. This must include slab boundaries/rates, demand charge, meter rent, VAT rule, rounding rules, and any exact recharge/charge ordering semantics. Do not guess these values.




Confirm exact tariff table and rounding convention from the challenge statement.


Confirm the exact convention for a day where a recharge and consumption both occur and balance is insufficient before the recharge event.


Confirm whether “higher-slab effect” is defined against the first slab rate or another reference basis in the challenge’s official wording.


20. Final Product Requirements Checklist


[ ] Six+ months of daily readings supported and validated.


[ ] Light month, heavy summer month, and last-week large recharge visible in case data.


[ ] Daily balance reconstructed from opening balance + recharges - meter costs.


[ ] Monthly slab counter resets only at calendar-month boundaries.


[ ] A day can span multiple slabs.


[ ] Recharge does not reset slab counter.


[ ] Demand charge and meter rent apply on first recharge of each month only, per tariff.


[ ] VAT is calculated separately and visibly.


[ ] Every recharge is marked on the balance line.


[ ] Depletion date is deterministic and explainable.


[ ] Target-date recharge is deterministic and decomposed into four required parts.


[ ] Low-balance and monthly habits share identical daily consumption and slab progression.


[ ] Comparison cost excludes the recharge/deposit amount itself.


[ ] Tie outcomes are supported.


[ ] No invented energy-rate savings from recharge timing.


[ ] Professional responsive UI, restrained animation, purposeful 3D, reduced-motion support.


[ ] No database/admin dependency for MVP.


[ ] Production deployment has health checks, CORS, validation, and regression tests.

End of PRD

