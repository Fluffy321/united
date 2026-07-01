# COPPA Compliance & Export/Encryption Compliance — JUnited

Prepared 2026-07-01. Covers iosReadiness tasks `coppa-compliance` and `export-compliance`.

---

## 1. COPPA Compliance

**Good news: most of this is already done in the codebase, not just planned.**

- `src/pages/TermsOfService.jsx` already states a 13+ minimum age requirement, with explicit note that users aged 13–17 get additional protections.
- `src/pages/PrivacyPolicy.jsx` already states "JUnited is available to users aged 13 and older" and has a dedicated COPPA section with a contact (`privacy@junited.app`).
- `src/pages/MinorSafetyPolicy.jsx` exists as a standalone page specifically for the 13–17 age band, routed at `/MinorSafetyPolicy`.

**Is JUnited directed at children under 13?** No. It's a general-audience community/social platform (posts, messaging, events, volunteering) with no content, marketing, or design specifically targeting children. Under the FTC's COPPA criteria (subject matter, visual content, language, presence of child celebrities/characters, music, age of models, ads directed at children, competitor sites' audience), JUnited does not meet the "directed to children" bar.

**Does JUnited need an age gate?** No new age gate is needed beyond what exists: the Terms of Service already state the 13+ requirement, and onboarding should be checked to confirm it doesn't collect a birthdate that would trigger COPPA's actual-knowledge standard for someone under 13. (Recommendation, not yet verified in this pass: if onboarding ever adds a birthdate field, add client-side validation that blocks continuing if the computed age is under 13, rather than silently accepting it — actual knowledge of an under-13 user is what creates COPPA liability, so avoid collecting a birthdate you'd then have to ignore.)

**Recommended App Store age rating (5-tier system, effective Jan 31, 2026):** **12+ or 15+**. JUnited has unrestricted user-generated content (posts, comments, direct messages) between adult members, which typically pushes ratings above the 9+ tier. Since content is generally visible only within a joined community (not a fully open public feed) and there's active moderation/reporting/blocking, 12+ is defensible; if Apple's questionnaire treats DMs as "unrestricted web access," expect it to land at 15+ instead. Answer the questionnaire honestly per the actual content exposure — this determination happens automatically based on your answers, not a number you pick directly.

**Action items (mostly manual, already unblocked by existing pages):**
- [ ] Manual: complete the age-rating questionnaire in App Store Connect (see `age-rating` task).
- [x] Terms of Service has a minimum-age statement — done.
- [x] Privacy Policy has a COPPA section — done.

---

## 2. Export Compliance / Encryption Declaration

JUnited's encryption footprint is entirely standard:
- HTTPS/TLS for all network calls (Supabase, Google/Apple OAuth, Resend).
- Browser/OS-level WebCrypto for session token handling — no custom implementation.
- No end-to-end message encryption, no VPN, no proprietary cipher.

**Correct answer for Apple's export compliance questionnaire: (A) "Yes, this app uses encryption"**, then select **"My app qualifies for the standard encryption exemptions."** This exemption applies because JUnited exclusively uses standard, publicly available encryption (HTTPS/TLS) for authentication and data transport — it doesn't implement or bundle its own cryptographic algorithms.

**ECCN / exemption:** This qualifies under the mass-market encryption exemption described in Category 5, Part 2 of the EAR (commonly cited informally as the "5D992.c" mass-market exemption). Apps that use only standard OS-provided encryption (TLS, HTTPS) for authentication or copy protection typically qualify for this exemption and do **not** need to register for an ERN (Encryption Registration Number) or file annual self-classification reports — that requirement is for exporters of custom/non-standard cryptographic products, which JUnited is not.

**To automate this for every future build**, add to `Info.plist` once the Capacitor iOS project exists:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```
This tells App Store Connect the app only uses exempt encryption, skipping the manual questionnaire on every subsequent upload. (Already included in the prepared Info.plist snippet — see `internal/app-store/ios-native-prep/info-plist-additions.md`.)
