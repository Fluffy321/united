# Roadmap Future-Improvements Scan

Identify roadmap-worthy future improvements, features, or deferred work surfaced during this session and reconcile them with `src/config/roadmap.js`.

Run this skill near the end of any applicable task — before writing the final report.

---

## Procedure

### Step 1 — Surface candidates from this session

Review the work completed in this conversation and identify anything that qualifies as future work:

- Future improvements explicitly mentioned ("could also…", "a follow-up would be…")
- Deferred enhancements ("not built in this pass", "out of scope but worth doing")
- Gaps or limitations discovered during an audit that imply meaningful product work
- Follow-up features that naturally extend what was just shipped
- Recommended next steps
- "Nice to have" ideas that arose but weren't pursued
- Architectural limitations that suggest a later-phase improvement

Write the candidate list before opening the roadmap file.

### Step 2 — Open and read `src/config/roadmap.js`

Read the entire file to understand what is already tracked — both shipped and planned/deferred items.

### Step 3 — Classify each candidate

For each candidate from Step 1, determine:

| Classification | Action |
|---|---|
| Already tracked (exact match or close) | No change — note in report as "already tracked" |
| Covered under an existing broader item | Merge: update the existing entry's description or `why` field |
| Deserves its own roadmap entry | Add a new entry with `status: 'planned'` or `'deferred'` |
| Too trivial, too implementation-specific, or not a product decision | Skip — explain why in the report |

### Step 4 — Update the roadmap

Make any adds or updates to `src/config/roadmap.js`.

Maintain roadmap quality:
- Avoid duplicates
- Use accurate `category`, `status`, `priority`
- Write clear `description` and, for deferred items, a meaningful `why`
- Merge related ideas rather than adding near-duplicate entries
- Do not add implementation noise (refactors, config tweaks) as product roadmap items

### Step 5 — Produce the scan summary

Output a structured summary in this exact format:

```
Roadmap future-improvements scan:
- Added: <item title> — <one-line reason>
- Updated: <item title> — <what changed>
- Not added, with reason: <idea> — <why it wasn't tracked>
```

If nothing warranted a change:

```
Roadmap future-improvements scan:
- No new roadmap-worthy future improvements identified.
```

---

## Key principles

- **Do not skip** this scan if meaningful future work was identified during the task.
- **Do not blindly add** every passing thought — use product judgment. Quality over quantity.
- **When uncertain**, err toward adding and marking `status: 'deferred'` rather than losing the idea.
- A missing scan section in the final report implies the scan was skipped — not that it found nothing. If nothing was found, say so explicitly.
- This scan is **not** required for trivial changes (one-line fixes, copy edits, typo corrections) unless future work is actually surfaced.

---

## Applicable task types

Run this scan after:
- Feature implementations (any size)
- Major bug fixes that reveal deferred polish or follow-up work
- Redesigns
- Architecture or readiness audits
- Admin or product tool additions
- Any task whose final report includes recommendations, limitations, or next steps
