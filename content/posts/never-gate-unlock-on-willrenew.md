---
title: "Never Gate Access on willRenew"
description: "A subscriber who turns off auto-renew still has paid access until the period ends. Treating willRenew as the paid check locks them out of an app they're still paying for."
slug: never-gate-unlock-on-willrenew
keywords: ["revenuecat willrenew", "subscription entitlement check", "storekit auto renew off", "subscriber locked out bug"]
queue: 11
status: queued
approved: true
publishDate:
---

> **Quick answer:** `willRenew == false` means the subscription won't renew, not that it has ended. A user who cancels auto-renew keeps access until `expirationDate`. Gate on `expirationDate == nil || expirationDate > now || willRenew` — or simply trust the SDK's own "is this entitlement active" answer, which already accounts for it.

This is a bug I shipped, and a user found it before I did.

```swift
// Wrong.
var isPaid: Bool {
    entitlement.willRenew
}
```

It reads correctly. It passes review. Every test you'd write for it passes, because in the sandbox and in normal use `willRenew` is true for an active subscriber.

Then someone turns off auto-renew.

## What actually happens when someone cancels

Turning off auto-renew doesn't end a subscription. It schedules it not to continue. The user has paid for a period and **keeps full access until that period ends** — that might be three weeks away.

So the state is: active, paid, entitled, `willRenew == false`.

With the check above, the app locks them out the instant they cancel. From their side: they paid for a month, decided not to continue, and were immediately denied the thing they'd already paid for. That's a refund request and a one-star review, and both are deserved.

It also hits people who never meant to cancel — auto-renew switches off for billing problems, expired cards, and users tidying up their subscriptions list without realising what it does.

## The correct check

If you're working with raw values:

```swift
var isPaid: Bool {
    if let expiry = entitlement.expirationDate {
        return expiry > Date() || entitlement.willRenew
    }
    return true   // no expiry — lifetime or non-consumable
}
```

Three cases, and each matters:

- **No expiry date** → a lifetime purchase or non-consumable. Always unlocked.
- **Expiry in the future** → paid access, regardless of renewal intent. This is the case the buggy version got wrong.
- **Expiry in the past but `willRenew`** → in a billing retry grace period. Apple is still trying to charge them, and cutting access mid-retry punishes someone whose card just expired.

If you're using RevenueCat, the simpler answer is that `entitlements.active` **already means valid access**. It accounts for all three cases. Reaching past it to inspect `willRenew` yourself is how the bug gets written in the first place — the SDK had already answered the question correctly.

## Why testing doesn't catch it

The happy path is overwhelmingly the common one, so it's what gets exercised. Reproducing this requires deliberately cancelling a sandbox subscription and then checking the app still works, which nobody thinks to do because the mental model is "cancelled means over".

Worth adding as an explicit case:

```swift
@Test func cancelledButUnexpiredIsStillPaid() {
    let entitlement = Entitlement(
        expirationDate: Date().addingTimeInterval(60 * 60 * 24 * 20),
        willRenew: false          // user turned off auto-renew
    )
    #expect(entitlement.isPaid)
}
```

## The wider lesson

The bug came from treating a *forward-looking* flag as a *current-state* flag. `willRenew` describes the future. Entitlement is about now.

Same trap shows up elsewhere in purchase code — treating "in grace period" as unpaid, treating "billing issue" as expired, treating a refund request as already refunded. Each is a signal about what might happen, being read as what has happened.

**The safe default when the state is ambiguous is to keep the user unlocked.** Wrongly granting access for a few days costs you very little. Wrongly denying it to someone who paid costs a refund, a review, and a person who won't come back.

If you have shipped subscription code that inspects renewal flags directly, it's worth ten minutes to go and look at it. This class of bug produces no crash, no log line, and no analytics event — the only signal is a support email from someone who assumes it's their fault.
