---
title: "Store SwiftData Enums as Raw Values, Not Codable"
description: "A Codable enum property becomes a composite attribute in the CloudKit schema and can't be used inside a #Predicate. Store the raw value and expose the enum through a computed accessor."
slug: swiftdata-store-enums-as-raw-values
keywords: ["swiftdata enum property", "swiftdata predicate enum", "swiftdata codable enum cloudkit", "swiftdata cannot use enum in predicate"]
queue: 6
status: queued
approved: true
publishDate:
---

> **Quick answer:** Declaring an enum property directly on a `@Model` stores it as a composite attribute, which CloudKit can't index and `#Predicate` can't filter on. Store the `rawValue` as a `String` or `Int` and expose the enum through a computed property.

This one looks fine, compiles fine, and then you can't query it.

```swift
enum Status: String, Codable {
    case draft, active, archived
}

@Model
final class Entry {
    var status: Status = .draft      // ← the problem
}
```

Then you try to filter:

```swift
FetchDescriptor<Entry>(
    predicate: #Predicate { $0.status == .active }   // won't work
)
```

## What's actually happening

A `Codable` enum property isn't stored as a simple column. SwiftData encodes it as a **composite attribute** — an opaque blob from the store's point of view. That has two consequences:

**`#Predicate` can't filter on it.** Predicates are translated into an underlying store query, and the store has no idea what's inside that blob. There's nothing to compare against.

**CloudKit can't index it.** In a synced store the composite attribute becomes an equally opaque CloudKit field. It syncs, but it isn't queryable, and it makes the schema harder to evolve later.

You end up fetching everything and filtering in memory, which works right up until the table has ten thousand rows.

## The fix

Store the raw value; keep the enum in the API.

```swift
enum Status: String, Codable, CaseIterable {
    case draft, active, archived
}

@Model
final class Entry {
    // Persisted. Note the default — CloudKit requires one on the declaration.
    var statusRaw: String = Status.draft.rawValue

    // Not persisted; @Model ignores computed properties.
    var status: Status {
        get { Status(rawValue: statusRaw) ?? .draft }
        set { statusRaw = newValue.rawValue }
    }
}
```

Now the predicate works, because it's comparing a plain string:

```swift
let active = Status.active.rawValue
FetchDescriptor<Entry>(
    predicate: #Predicate { $0.statusRaw == active }
)
```

Note the local binding. `#Predicate` won't let you call `.rawValue` inside the closure — pull the value out first and capture it.

## Handling the unknown case

The `?? .draft` in that getter is doing real work, and it's worth thinking about rather than copying.

A synced store can hand you a raw value your build doesn't recognise: a newer version of the app added `case published`, wrote it, and an older device syncs it down. `Status(rawValue:)` returns nil, and if you force-unwrap, that device crashes on data it was never going to understand.

Falling back to a sensible default keeps the app running. If losing the distinction matters, keep the original string around so a later version can recover it rather than overwriting it with the fallback on the next save.

## `String` or `Int`?

**Prefer `String`.** An `Int` raw value is smaller, but it couples your persisted data to declaration order — insert a case in the middle and every stored row silently means something different. That's a genuinely nasty migration, and it can't be detected after the fact.

String raw values are self-describing. You can read the store and understand it, and reordering cases is harmless.

## The general rule

**Persist primitives; expose types.** The persisted layer wants strings, numbers, dates and booleans, because those are what stores can index, query and sync. Rich types belong in the computed layer on top, where Swift's type system does its job and the store never sees them.

Same reasoning applies to anything else you might be tempted to make `Codable` on a model — a small struct of settings, a coordinate pair, a set of flags. If you'll ever want to filter on it, it needs to be a column.
