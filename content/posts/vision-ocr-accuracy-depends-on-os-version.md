---
title: "Your Vision OCR Accuracy Depends on the OS, Not Your Code"
description: "VNRecognizeTextRequest's default revision drifts between iOS versions, and pinning a legacy revision no longer restores the old behaviour. What that does to a frozen benchmark."
slug: vision-ocr-accuracy-depends-on-os-version
keywords: ["vnrecognizetextrequest revision", "vision ocr accuracy ios", "vision framework regression", "ios ocr benchmark"]
queue: 10
status: queued
publishDate:
---

> **Quick answer:** `VNRecognizeTextRequest` uses a default revision that changes with the OS, and on recent iOS versions setting a legacy `revision` is a no-op — the request is routed through the current engine regardless. A benchmark frozen on one iOS scores differently on another with zero code changes, so record the OS version alongside every accuracy number.

If you have an OCR pipeline with an accuracy suite, this will eventually happen: the numbers move and nothing in your repository changed.

Same code, same test images, byte-identical corpus. One iOS version scored 96.7% on a printed-code corpus; a later one scored 88.3% on exactly the same inputs. An eight-point drop, entirely on Apple's side.

## Why the numbers move

`VNRecognizeTextRequest` is versioned by *revision*. Each revision is a different model with different behaviour, and the **default revision changes as the OS changes**. You don't opt into that — running on a newer OS silently gives you a newer recogniser.

The obvious defence is to pin it:

```swift
let request = VNRecognizeTextRequest()
request.revision = VNRecognizeTextRequestRevision3   // may do nothing
```

**On recent iOS this is a no-op for text recognition.** Legacy revisions get routed through the current engine, and the output is byte-identical to not setting it at all. The property still exists and still accepts the value; it just doesn't change what you get back.

Worth knowing that this isn't uniform across Vision. `VNGenerateImageFeaturePrintRequest` revisions *do* still pin — so a feature-print pipeline can be held stable in a way a text pipeline can't. If you have both, don't assume the behaviour you observed in one applies to the other.

## What this breaks

**Frozen benchmarks stop meaning anything.** An accuracy figure without an OS version attached isn't a measurement. "96.7%" is only interpretable as "96.7% on iOS 18.6".

**A regression suite can fail on a green branch.** CI moves to a newer simulator runtime, thresholds are breached, and someone spends a day looking for a change that doesn't exist.

**Acceptance thresholds tuned on one OS may be wrong on another.** If you've fitted a confidence cutoff to separate good matches from bad, that boundary was fitted against one recogniser's score distribution. A different recogniser can shift the distribution underneath it, and the cutoff quietly starts making different decisions.

## What to do instead

**Record the OS version with every accuracy number.** In the results file, in the commit message, in the dashboard. A number without it can't be compared to anything.

**Pin the simulator runtime in CI**, and treat changing it as a deliberate event rather than an incidental upgrade. When you do move, re-baseline in a separate commit that changes nothing else, so the delta is attributable.

**Re-measure after every OS bump** before shipping anything that depends on the numbers. This is a real ongoing cost of building on a system OCR engine, and it's worth knowing about up front rather than discovering it in a release week.

**Treat thresholds as OS-scoped.** If accuracy matters enough to have a cutoff, the cutoff needs re-fitting when the engine underneath it changes.

## The other thing that looks like a regression

Before concluding the engine got worse, check your fixtures.

A "wrong match" in an OCR suite is more often a mislabelled test image than a pipeline fault. The expected value was typed by hand, the image is ambiguous, or the label was copied from a similar case. Every time this looked like a model regression and got investigated properly, a meaningful share turned out to be bad ground truth.

Which is its own useful practice: when the suite disagrees with the model, **look at the image before you look at the code.** It's a thirty-second check that regularly saves the afternoon, and it improves the corpus permanently rather than chasing a phantom.
