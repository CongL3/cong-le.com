---
title: "Best Small LLMs to Run on Your Home Mac with Ollama"
description: "An honest roundup of the best small LLMs to run locally on a Mac with Ollama: Llama, Qwen, Mistral, Phi, and Gemma, with qualitative guidance by RAM."
slug: best-small-llms-to-run-on-home-mac-with-ollama
app: ollama-connect
keywords: ["best small llm ollama", "local llm for mac", "small llm home server"]
queue: 21
status: queued
publishDate:
---

> **Quick answer:** For a home Mac, the best small LLMs to run with Ollama are Llama 3.2 (1B/3B) or Llama 3.1 (8B) as the safe default, Qwen2.5 and Qwen2.5-Coder for reasoning and code, and Mistral 7B, Phi-3, or Gemma 2 as strong alternatives. Match size to memory: 8 GB RAM suits 1B-3B models, 16 GB runs 7B-8B comfortably, 32 GB handles 13B-14B, and 64 GB+ reaches 30B-class models. Pull two or three with `ollama pull` and test them on your own prompts, since the right pick depends on your hardware and tasks.

The nice thing about running models locally is that trying a new one costs a download, not a subscription. The confusing thing is that there are dozens of options and every week someone claims a new one is "the best." This roundup skips the leaderboard hype and gives qualitative, practical guidance on which small models are worth pulling on a home Mac, and how to match a model to the memory you actually have. I am not going to quote benchmark numbers, because for local use what matters is how a model feels on your hardware and your tasks, which you can test in minutes.

## How to think about model size

Local models come in sizes measured in billions of parameters, from around 1B up to 70B and beyond. The size, combined with how aggressively it is quantized (compressed), determines how much memory it needs and how fast it runs.

A rough mental model for Apple Silicon, where unified memory is shared between CPU and GPU:

- **8 GB RAM:** stick to models around 1B to 3B parameters.
- **16 GB RAM:** 7B to 8B models run comfortably; this is the sweet spot for most people.
- **32 GB RAM:** you can run 13B to 14B models and larger quantized ones.
- **64 GB and up:** 30B-class models, and 70B with heavier quantization.

Bigger is not automatically better for your use case. A well-chosen 7B model that responds instantly often beats a sluggish 14B one you get impatient with.

## The models worth trying

### Llama 3.x (Meta)

The Llama 3 family, including the 3.1 and 3.2 releases, is the sensible default. The small versions punch above their weight for general chat, writing, and reasoning, and the ecosystem support is excellent. The 3.2 line includes very small 1B and 3B variants that run on modest machines and are genuinely useful for quick tasks; Meta's own Llama 3.2 model card lists the 1B and 3B text models as designed for on-device and edge use.

```bash
ollama pull llama3.2      # small, fast, great starting point
ollama pull llama3.1      # 8B, stronger general-purpose model
```

Start here if you are unsure. It is the most likely to just work well for whatever you throw at it.

### Qwen (Alibaba)

The Qwen family has become a favorite for local use, especially recent generations. The small and mid-sized variants are strong at reasoning and notably good at coding and multilingual tasks. If you write code or work across languages, Qwen is well worth comparing directly against Llama on your own prompts.

```bash
ollama pull qwen2.5
ollama pull qwen2.5-coder   # tuned for programming
```

The coder variant in particular is a common recommendation for a local programming assistant.

### Mistral (Mistral AI)

Mistral 7B was one of the models that proved small could be genuinely capable, and it remains a solid, efficient all-rounder. It is fast, lean on memory for its ability, and a good pick when you want quick responses without much overhead.

```bash
ollama pull mistral
```

### Phi (Microsoft)

The Phi family is designed around the idea that careful training data lets a small model reason better than its size suggests. The Phi models are tiny and quick, which makes them attractive on 8 GB machines or when you want snappy replies for structured, reasoning-style prompts. They can feel narrower than a general-purpose Llama on open-ended chat, so try both.

```bash
ollama pull phi3
```

### Gemma (Google)

Gemma is Google's open-weight family, and the small variants are polished, well-behaved general models. They are a good third option to have in rotation alongside Llama and Qwen, and some people simply prefer their tone and style.

```bash
ollama pull gemma2
```

## How to actually choose: test, don't read

Here is the honest advice: pull two or three of the above and run *your own* representative prompts through each. Whatever task you use AI for, be it drafting emails, explaining code, brainstorming, or summarizing, that is the only benchmark that matters. A model that tops a public leaderboard may still feel wrong for your particular style of question, and vice versa.

Ollama makes this cheap. Pull several, then compare:

```bash
ollama run llama3.1 "Summarize the plot of Hamlet in three bullet points."
ollama run qwen2.5   "Summarize the plot of Hamlet in three bullet points."
ollama run gemma2    "Summarize the plot of Hamlet in three bullet points."
```

Judge for yourself which response you would rather have received. Do that across a handful of your real tasks and a clear favorite usually emerges within an afternoon.

## Using them from your phone

Once you have a couple of models you like on your Mac, you do not have to sit at the desk to use them. [Ollama Connect](/apps/ollama-connect/) lets you chat with any of your local models from your iPhone over your home network, with per-chat model selection so you can keep, say, a coding model and a general model each in their own conversation. Setup is covered in [how to chat with Ollama from your iPhone](/blog/how-to-chat-with-ollama-from-your-iphone/), and the [network setup guide](/blog/ollama-setup-guide-serving-models-on-local-network/) handles the server side.

## A note on quantization

If a model feels too slow or does not fit, look for a more heavily quantized version. Ollama tags let you pull different quantization levels of the same model. More aggressive quantization uses less memory and runs faster at some cost to quality. For most everyday use, the default quantizations Ollama ships are a sensible balance, but dropping to a smaller one can be the difference between a model that fits your machine and one that does not.

## FAQ

### What is the best small LLM to run on a Mac?

There is no single winner. Llama 3.x is the safest default, Qwen is excellent for coding and multilingual work, and Mistral, Phi, and Gemma each have strengths. The best approach is to pull two or three and test them on your own prompts, since the right choice depends on your hardware and tasks.

### How much RAM do I need for a decent local model?

16 GB is the practical sweet spot, comfortably running strong 7B-8B models. With 8 GB you are limited to smaller 1B-3B models, while 32 GB and up lets you run 13B-class models and beyond.

### Why not just run the biggest model I can?

A larger model that responds slowly often gets used less than a fast, smaller one that answers instantly. Bigger also is not always better for a given task. Match the model to both your memory and your patience, and test whether the larger one actually gives you noticeably better answers.

### Do I need an internet connection to use these models?

You need internet once to download a model with `ollama pull`. After that the model runs entirely offline on your machine. You only need your local network to reach it from another device like a phone.

### What is quantization and should I care?

Quantization compresses a model so it uses less memory and runs faster, with some loss of quality. Ollama's default quantizations are a good balance. If a model is too slow or will not fit, pull a more heavily quantized tag of the same model.
