---
title: "Approved IAP Localisations Can't Be Changed by API"
description: "Once an in-app purchase is approved, its display name and description are ACTIVE and immutable through the App Store Connect API. What you can still change, and the 55-character limit that isn't 255."
slug: approved-iap-localisations-are-immutable
keywords: ["app store connect api in app purchase", "inapppurchaselocalization active state", "iap display name change", "iap description character limit"]
queue: 12
status: queued
publishDate:
---

> **Quick answer:** After an IAP is approved, `PATCH` on its localisation returns "Cannot edit InAppPurchaseLocalization when it is in ACTIVE state". Display name and description become a manual App Store Connect UI step. The reference name *can* still be changed by API — but names are unique per app, so swapping two products' names needs the current holder renamed first.

If you automate App Store Connect, this is where automation stops.

```
Cannot edit InAppPurchaseLocalization when it is in ACTIVE state
```

Everything about an in-app purchase is scriptable — creating the product, setting price points, attaching it to an entitlement, submitting it — right up until it's approved. Then the customer-facing text freezes, and changing it means opening the browser.

## What's locked and what isn't

**Locked once approved:** display name and description, per locale. These are what the customer reads on the paywall and in their purchase history, so Apple treats a change as needing review rather than a silent edit.

**Still editable by API:** the reference name, via `PATCH /v2/inAppPurchases/{id}`. That's the internal label you see in App Store Connect and in reports — customers never see it.

**Also still doable:** price changes, availability, and adding new products. Restructuring a paywall is largely automatable; renaming the old products for customers is not.

## The uniqueness trap when renaming

Reference names are unique per app. So swapping names between two products — a common move when restructuring a subscription ladder — fails on the first call, because the name you're assigning is still held by the other product.

Rename the current holder to something temporary first:

```
PATCH /v2/inAppPurchases/{productB}   name: "Annual (old)"
PATCH /v2/inAppPurchases/{productA}   name: "Annual"
PATCH /v2/inAppPurchases/{productB}   name: "Monthly"
```

Three calls where you expected two.

## The 55-character limit

Unrelated but adjacent, and it wastes a submission the first time: **the IAP localisation description is limited to 55 characters**, not the 255 you might assume from app-level metadata fields.

Fifty-six characters is rejected. It's short enough that it constrains what you can say, so write it before you build the paywall rather than discovering the limit while trying to submit.

Display names have their own, shorter limit again. Both are per-locale, so a description that fits in English may not fit in German, where compound words routinely run 30% longer.

## Working with the freeze

The practical consequence is that **IAP copy should be treated as near-permanent from the moment you first submit.** Not a first draft to be tidied later.

A few habits that follow:

- **Write the customer-facing text first**, before creating the product. It's the part you can't easily change, so it deserves more attention than the parts you can.
- **Avoid encoding anything time-bound.** A description mentioning a price, a promotion, or a feature you might remove will outlive the thing it describes.
- **Keep the reference name descriptive and the display name customer-facing.** They serve different readers, and only one of them is stuck.
- **Check every locale's length before submitting**, not just English.

If you do need to change approved copy, it's a manual edit in App Store Connect followed by a new review. Not difficult — just not something you can put in a script, which is worth knowing before you build a pipeline that assumes you can.

## The general shape of ASC automation

Most of App Store Connect is genuinely automatable now, including things that used to need the UI — submissions, age ratings, Game Center configuration. The exceptions cluster around anything a reviewer has already looked at.

That's a reasonable rule of thumb when planning: **if a human at Apple approved it, expect changing it to require another human.** Everything upstream of approval is fair game for scripting.
