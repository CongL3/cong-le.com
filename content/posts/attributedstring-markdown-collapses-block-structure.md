---
title: "AttributedString(markdown:) Throws Away Your Paragraphs"
description: "With default options, AttributedString's markdown parser joins paragraphs with no separator and drops list bullets — turning model output into run-on text. The option that fixes it."
slug: attributedstring-markdown-collapses-block-structure
keywords: ["attributedstring markdown swiftui", "markdownparsingoptions inlineonlypreservingwhitespace", "swiftui markdown lists", "attributedstring newlines missing"]
queue: 15
status: queued
publishDate:
---

> **Quick answer:** `AttributedString(markdown:)` defaults to `interpretedSyntax: .full`, which parses block elements and then discards them, joining paragraphs with no separator and dropping list markers. Use `.inlineOnlyPreservingWhitespace` and normalise list markers yourself.

Render a language model's reply with the obvious code and the output is wrong in a specific, ugly way:

```swift
Text(try AttributedString(markdown: response))
```

```
Keep it simple:Use TailscaleForward the port
```

Three separate blocks — a line, then two bullets — welded together with no space at all.

## What the parser is doing

`AttributedString`'s markdown support is built for **inline** formatting: bold, italic, links, code spans. It understands block structure — paragraphs, lists, headings — but `AttributedString` is a flat string with attributes and has nowhere to put a "this is a list item" concept.

So with the default `interpretedSyntax: .full`, block elements are parsed and then dropped. The paragraph break isn't converted to a newline; it's consumed. The `-` marker isn't rendered as a bullet; it's recognised as list syntax and removed. You lose the separator and the marker, and the text runs together.

That's why the bug looks like missing newlines rather than missing markdown. The formatting you asked for arrived — bold is bold — while the structure quietly vanished.

## The fix

Stop it interpreting block syntax at all, and keep the whitespace that was already in the string:

```swift
let options = AttributedString.MarkdownParsingOptions(
    interpretedSyntax: .inlineOnlyPreservingWhitespace
)
let attributed = try AttributedString(markdown: response, options: options)
```

Now newlines survive, because they're just characters. Inline formatting still works.

The trade is that list markers are now literal — you get `- Use Tailscale` rather than a bullet. Normalise them per line:

```swift
func normalisedMarkdown(_ text: String) -> String {
    text
        .split(separator: "\n", omittingEmptySubsequences: false)
        .map { line -> String in
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard let marker = trimmed.first, "-*+".contains(marker),
                  trimmed.dropFirst().first == " " else { return String(line) }
            return "•" + trimmed.dropFirst()
        }
        .joined(separator: "\n")
}
```

Crude, and correct for the case that matters. It doesn't handle nested lists or ordered lists — if you need those, you've outgrown `AttributedString` and want a real markdown renderer that emits views per block.

## The preview-snippet variant

The mirror-image bug shows up wherever you display a one-line preview — a conversation list, a widget, a notification.

There you *don't* want to parse markdown at all, because the string is truncated and rendered as plain text. So the raw syntax shows through: `**Important**: check the...` with the asterisks visible.

Strip the markers rather than parsing:

```swift
func plainPreview(_ text: String) -> String {
    text.replacingOccurrences(of: #"[*_`#>]"#, with: "", options: .regularExpression)
        .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
        .trimmingCharacters(in: .whitespaces)
}
```

Two different treatments for the same source text: full inline parsing in the detail view, markers stripped in the list. Using one for both is what produces either visible asterisks in previews or run-on text in the body.

## Where this bites hardest

Anything rendering model output. Language models produce markdown by default and lean heavily on exactly the block structure this parser discards — short paragraphs, bulleted lists, the occasional heading. It's the format most likely to look broken.

It's also easy to miss in testing, because a one-sentence reply has no block structure to lose. The bug only appears once a response is long enough to be formatted, which tends to mean once real people are using it.
