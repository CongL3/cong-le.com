---
title: "Every SwiftData Property Needs a Default Value"
description: "If you use SwiftData with CloudKit and a property has no default, the store fails silently and every fetch returns empty. Here's why, and the fix."
slug: swiftdata-properties-need-default-values
keywords: ["swiftdata cloudkit", "swiftdata empty results", "swiftdata default value", "modelcontainer failed to load"]
queue: 1
status: published
publishDate: 2026-08-03
---

Here is a bug that costs an afternoon the first time you meet it, and about ninety seconds every time after.

You add SwiftData to an app, enable CloudKit sync, run it, and everything appears fine. No crash, no red text. But nothing you insert is ever saved, and every fetch comes back empty. The UI renders its empty state perfectly, forever.

The cause is almost always this:

```swift
@Model
final class Entry {
    var title: String
    var count: Int
}
```

And the fix is this:

```swift
@Model
final class Entry {
    var title: String = ""
    var count: Int = 0
}
```

## Why CloudKit forces this

SwiftData on its own is relaxed about non-optional properties without defaults. CloudKit is not.

CloudKit's schema model has no concept of a required field. Any record type it syncs must be able to exist with a value missing, because a record can arrive from a device running an older version of your app that never knew about that field. So every attribute in a CloudKit-backed store has to be either **optional** or **have a default value** — those are the only two shapes that survive a partial record.

A non-optional `String` with no default is neither. There is no legal value for it when the field is absent, so the schema is rejected.

## Why it's silent

This is the part that wastes the afternoon. The container fails to load, but a `ModelContainer` failure at app startup doesn't necessarily crash — depending on how you construct it, you can end up with a container that exists but has no working store behind it. Inserts go nowhere. Fetches return `[]`. No exception reaches your code.

Everything downstream behaves exactly like a database that is simply empty, which is a state your app is designed to handle gracefully. Your error handling hides the error.

The symptom looks like a data-flow bug — a wrong predicate, a missing `@Query`, a context that isn't propagating — and that's where most of the afternoon goes. It isn't any of those. The store never opened.

## Spotting it faster

**Look at the console at launch, before anything else.** The failure does usually log, somewhere in the noise of a normal startup, mentioning that the model couldn't be loaded or the schema is invalid for CloudKit. It scrolls past because it appears while you're still looking at the simulator, not the log.

**Construct the container so failure is loud.** If you're building a `ModelContainer` inside a `try?` or falling back to an in-memory store when the real one fails, you have written the silence yourself. During development, let it crash — a fatal error at launch is far cheaper to diagnose than an app that runs and quietly does nothing.

**Check the model, not the query.** If a fetch returns empty and you're certain you inserted, check every `@Model` property before you touch the predicate.

## The rule we work to

**Every `@Model` property gets a default value on the declaration.** Not in `init` — on the property itself.

```swift
@Model
final class Trip {
    var name: String = ""
    var startDate: Date = Date.distantPast
    var isArchived: Bool = false
    var notes: String? = nil          // optional is fine too
    var items: [Item]? = nil          // relationships: optional
}
```

Setting it in `init` doesn't help. The schema is derived from the property declarations, so a default supplied only by an initialiser is invisible to the thing doing the validating.

Applying this unconditionally — even to models that aren't CloudKit-backed today — costs nothing and removes the possibility of the bug entirely. We treat it as a hard rule across every app rather than a thing to remember when enabling sync, because "we'll add sync later" is exactly when this resurfaces, in an app whose models were written months earlier by someone who has forgotten this post exists.

## One related trap

Relationships need the same treatment. A to-many relationship that isn't optional will fail schema validation for the same reason: CloudKit can't express "this must have at least one." Make relationship properties optional, and handle the nil case in your UI.

If you have already lost the afternoon: it wasn't the predicate.
