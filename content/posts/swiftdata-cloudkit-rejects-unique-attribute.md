---
title: "CloudKit Rejects @Attribute(.unique) — Model Around It"
description: "SwiftData's unique constraint is incompatible with CloudKit sync. Why there's no workaround, and how to enforce uniqueness without it."
slug: swiftdata-cloudkit-rejects-unique-attribute
keywords: ["swiftdata attribute unique cloudkit", "swiftdata unique constraint", "cloudkit schema validation failed", "swiftdata cloudkit rules"]
queue: 5
status: published
publishDate: 2026-08-31
updated: 2026-09-03
---

> **Quick answer:** `@Attribute(.unique)` cannot be used in a CloudKit-backed SwiftData store. CloudKit has no unique-constraint concept, so `ModelContainer.init` rejects the schema outright. Enforce uniqueness in your code instead — fetch-then-insert, or an upsert helper — and design for the fact that two offline devices can still create the same record.

Add `@Attribute(.unique)` to a model, turn on CloudKit sync, and the container refuses to build. There is no flag, no partial mode, and no version of this that works.

```swift
@Model
final class Card {
    @Attribute(.unique) var code: String = ""   // ← breaks CloudKit
}
```

## Why there's no workaround

CloudKit's record model doesn't have unique constraints. It can't — it's a distributed store designed for devices that spend a lot of time offline. Two devices in aeroplane mode can both create a record with the same value, and neither can know until they sync. A constraint that can't be checked at write time isn't a constraint.

So SwiftData validates the schema up front rather than failing mysteriously later. That's the right call, but it means the fix is architectural rather than a keyword.

This sits alongside the other CloudKit schema rules, which have the same root cause — a record must be able to exist with a field missing:

- Every attribute optional or defaulted **on the declaration**, not just in `init`
- All relationships optional
- No `@Attribute(.unique)`
- If an enum needs filtering, persist a queryable raw `String`/`Int` column and expose the enum as a computed property

## Enforcing uniqueness yourself

The practical replacement is a fetch-then-insert:

```swift
func upsertCard(code: String, in context: ModelContext) throws -> Card {
    var descriptor = FetchDescriptor<Card>(
        predicate: #Predicate { $0.code == code }
    )
    descriptor.fetchLimit = 1

    if let existing = try context.fetch(descriptor).first {
        return existing
    }

    let card = Card(code: code)
    context.insert(card)
    return card
}
```

Route every insert through it. The moment one code path inserts directly, the invariant is gone — which is exactly what the attribute used to prevent, and why this is worth wrapping rather than remembering.

## Design for duplicates arriving anyway

This is the part that matters more than the helper. Even with a perfect upsert, **two offline devices can create the same record independently**, and both will sync. Your uniqueness is best-effort within one device, not across the account.

So the model needs to tolerate duplicates rather than assume they can't happen:

- **Fetch defensively.** Use `.first` on a sorted fetch rather than assuming exactly one row. Code that does `results[0]` after asserting a count of 1 will crash on a user's device eventually.
- **Make merging cheap.** If a duplicate appears, can you fold them together without losing data? Designing the model so merge is possible is worth more than trying to prevent the collision.
- **Give records a deterministic identity.** If uniqueness comes from a natural key — a card code, an ISBN, a date — two devices generating the "same" record will at least agree on which one it is, which makes dedupe straightforward. Random UUIDs generated per device do the opposite.

A dedupe pass at launch, keeping the oldest and folding the rest, is usually simpler than any scheme to prevent duplicates in the first place.

## Verify the schema in a test

The useful thing about this validation being up front is that you can catch it in CI. With `cloudKitDatabase: .private(...)`, `ModelContainer.init` validates the entire schema — so a test that just constructs the container is real evidence, not a no-op:

```swift
@Test func schemaIsCloudKitCompatible() throws {
    let config = ModelConfiguration(cloudKitDatabase: .private("iCloud.com.example.app"))
    _ = try ModelContainer(for: Card.self, Deck.self, configurations: config)
}
```

That one test catches the CloudKit schema rules above — the missing default,
the non-optional relationship, and the unique attribute — at the moment someone
adds them, rather than when a user turns on sync and the store silently fails to
load. Queryability of an enum is a separate predicate concern; test that with a
fetch using the raw column you intend to query.

For the distinction between persistable enums, Codable attributes, and queryable
values, see Apple's [SwiftData enumeration documentation](https://developer.apple.com/documentation/swiftdata/defining-data-relationships-with-enumerations-and-model-classes)
and [SwiftData Codable guidance](https://developer.apple.com/videos/play/wwdc2026/274/).
