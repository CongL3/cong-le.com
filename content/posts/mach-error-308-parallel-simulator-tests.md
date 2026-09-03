---
title: "Mach Error -308 and the Shared Simulator Problem"
description: "Parallel test runs that share a simulator die with 'Mach error -308 (server died)'. Why simctl erase then fails with Invalid argument, and why simctl shutdown all makes it worse."
slug: mach-error-308-parallel-simulator-tests
keywords: ["mach error -308", "server died xcodebuild test", "simctl invalid argument", "parallel xcodebuild tests"]
queue: 9
status: queued
approved: true
publishDate:
---

> **Quick answer:** `Mach error -308 (server died)` in a test run usually means two processes are using the same simulator or the same DerivedData. Give each concurrent run its own `-derivedDataPath` and its own simulator created with `simctl create`, and never run `simctl shutdown all` — it kills other runs in flight.

The error looks like a crash in your code:

```
Mach error -308 (server died)
```

Often alongside failures that make no sense — a test-runner that dies mid-suite, `mkstemp` errors on the result bundle, or a suite that reports failures which pass when run alone.

None of it is your code. It's two processes fighting over one resource.

## Two shared resources, same symptom

**DerivedData.** Two `xcodebuild` invocations against the same app, sharing the default DerivedData location, will corrupt each other's intermediates and result bundles. Give each its own:

```bash
xcodebuild test \
  -derivedDataPath ".build/dd-$SESSION" \
  -destination "platform=iOS Simulator,id=$UDID"
```

**The simulator itself.** This one is less obvious. If two runs both target `platform=iOS Simulator,name=iPhone 16`, they get the *same device*, and the second test-runner installation stamps on the first. Same `-308`, same nonsense failures.

The tell is that `simctl erase` or `simctl boot` on that device fails with `Invalid argument` — because another process is holding it.

## Give every run its own device

```bash
UDID=$(xcrun simctl create "Test-$SESSION" \
  "iPhone 16 Pro" \
  com.apple.CoreSimulator.SimRuntime.iOS-18-6)

xcodebuild test \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath ".build/dd-$SESSION" \
  -parallel-testing-enabled NO

xcrun simctl delete "$UDID"
```

Target it **by UDID**, not by name. Names aren't unique, and `name=` resolution can pick a device someone else is using.

Delete it afterwards. Simulators are cheap but not free, and a few hundred abandoned devices makes `simctl list` unusable and eats real disk.

## Never `simctl shutdown all`

It's the reflex when the simulator misbehaves, and it's the single worst command to run on a machine doing concurrent work. It shuts down **every** booted device, including ones in the middle of another run — which then fails with the same class of error, sending whoever owns it off to debug a problem you created.

If a specific device is wedged, shut down that device by UDID.

## Verify the destination exists

A related time-waster: a destination copied from a doc or another project may name a runtime that isn't installed. The failure is a confusing "unable to find a device matching" rather than "that runtime isn't here". List what you actually have:

```bash
xcrun simctl list runtimes
xcrun simctl list devices available
```

## When it isn't concurrency

Two other causes worth ruling out before you go hunting:

**A 0.000s failure is always the environment.** If a test suite that normally takes two minutes "fails" instantly, nothing ran. Something in the setup died — a missing destination, a broken derived-data path, a simulator that wouldn't boot. Read the top of the log for the real error rather than the failure summary at the bottom.

**Check the test count, not just pass/fail.** A run that reports zero failures but ran forty tests instead of two hundred is a failure wearing a green tick. If the count drops after a change, something is silently not executing — a crashed test host, a truncated suite, a filter that matched nothing.

That last one bites with Swift Testing's `-only-testing` selectors, which need a trailing `()` on `@Test` function names. Get it wrong and you don't get an error — you get a run that matches nothing and passes.
