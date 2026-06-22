---
name: Career Platform Restructuring
description: Summary of the major restructuring done to Ask MiGi — travel agent removal, career expert rebranding, new question flow with ai_draft status.
---

## What changed

- All travel agent pages removed from routing (BecomeAnExpertPage, ExpertWelcomePage, ExpertVerificationPage, ExpertCreateServicePage, ExpertBuyCoinsPage, TravelAgentsPage).
- ExpertLayout sidebar: removed "Earnings History" nav item, removed Buy Coins button, subtitle changed from "Immigration Expert" → "Career Expert".
- ExpertDashboardPage: removed Earnings card, Questions Answered card, Complete Verification card. Now shows only Live Questions Feed. Answer flow has Edit → Preview → Send steps. Pre-populates textarea with AI draft.
- ChatInput: replaced 3 audience tabs with 2 CTAs ("Chat an Expert" / "Call an Expert"). Call an Expert opens a phone popup with clickable tel: link. Phone number stored as `EXPERT_PHONE` constant in ChatInput.tsx.
- AuthSheets: ExpertRegisterDialog no longer rendered — register always uses RegisterDialog (user role only).

## Question flow (ai_draft)

- User submits question → status: "pending"
- AI generates draft → status: "ai_draft" (NOT shown to user; shown to expert for editing)
- Expert notified via email to EXPERT_EMAIL env var (sendNewQuestionEmail)
- User sees "pending" state for both "pending" and "ai_draft" statuses
- Expert reviews draft, edits, previews, clicks "Send to User" → status: "answered"
- User receives email notification (sendExpertReplyEmail) + can see response

**Why:** Users should not see raw AI output. Expert reviews/personalises before it reaches the user.

## Env vars required

- `EXPERT_EMAIL` — career expert's email address; expert notification emails are sent here when new questions arrive. If not set, notification is skipped silently.
- `RESEND_API_KEY` — email sending
- `GROQ_API_KEY` — AI draft generation

## Enquiry statuses

- "pending" — just created, AI hasn't generated yet
- "ai_draft" — AI draft generated, awaiting expert review (shown in expert feed, hidden from user)
- "answered" — expert sent final response (visible to user)
