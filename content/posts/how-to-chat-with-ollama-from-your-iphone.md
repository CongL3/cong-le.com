---
title: "How to Chat with Ollama from Your iPhone"
description: "Set up an Ollama iPhone client in minutes: run Ollama on your Mac or PC, expose it on your network, and chat with your local models on the go."
slug: how-to-chat-with-ollama-from-your-iphone
app: ollama-connect
keywords: ["ollama iphone client", "chat with ollama on iphone", "ollama mobile app"]
queue: 3
status: published
publishDate: 2026-07-10
updated: 2026-07-11
---

> **Quick answer:** To chat with Ollama from your iPhone, start the server on your Mac or PC with `OLLAMA_HOST=0.0.0.0 ollama serve` so it listens on your whole network instead of just localhost, then connect an iOS client like [Ollama Connect](/apps/ollama-connect/) to your computer's local IP on Ollama's default port 11434 (for example `http://192.168.1.42:11434`). Both devices must be on the same Wi-Fi. Everything stays on your own hardware, with no cloud account and nothing routed through a third party.

If you already run Ollama on your Mac or home server, you have a capable local AI sitting on your desk. The problem is that it stays on your desk. When you are on the couch, in the kitchen, or out of the house, that model may as well not exist. This guide walks through connecting to your existing Ollama server from your iPhone so you can chat with your own models from anywhere on your network.

The whole setup takes about ten minutes and requires no cloud service, no account, and no third party sitting between you and your model.

## What you need first

Before touching your phone, make sure the desktop side is in order:

- A computer running **Ollama** (macOS, Linux, or Windows).
- At least one model pulled locally. If you have not done this yet, grab a small one:

```bash
ollama pull llama3.2
```

- Your Mac/PC and your iPhone on the **same Wi-Fi network**.

You can confirm Ollama is working locally by running a quick chat in the terminal:

```bash
ollama run llama3.2 "Say hello in one sentence."
```

If that streams back a response, the engine is healthy. Now we just need to make it reachable from the phone.

## Step 1: Expose Ollama on your network

By default, Ollama only listens on `127.0.0.1` (localhost). That is deliberately private, but it means nothing outside the machine itself can reach it, including your phone. Ollama's own documentation confirms the server binds to `127.0.0.1:11434` unless you override it with the `OLLAMA_HOST` environment variable. To open it up to your local network, set the `OLLAMA_HOST` environment variable and restart the server.

Stop any running Ollama instance first (quit the menu bar app on macOS), then start it bound to all interfaces:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

`0.0.0.0` tells Ollama to listen on every network interface rather than just localhost. It will now accept connections on its default port, **11434**.

On macOS, if you prefer the background service to always bind this way, set it persistently and relaunch:

```bash
launchctl setenv OLLAMA_HOST "0.0.0.0"
```

Then quit and reopen the Ollama app so it picks up the variable.

## Step 2: Find your computer's local IP address

Your phone needs the machine's address on the network. On macOS:

```bash
ipconfig getifaddr en0
```

On Linux:

```bash
hostname -I | awk '{print $1}'
```

You will get something like `192.168.1.42`. Write it down. That plus the port gives you the full endpoint your phone will use: `http://192.168.1.42:11434`.

## Step 3: Verify it works before touching your phone

This step saves a lot of frustration. From **another device** on the same network (or even the same Mac using the IP instead of localhost), confirm the server answers:

```bash
curl http://192.168.1.42:11434/api/tags
```

If you get back a JSON list of your installed models, the server is reachable across the network and you are ready to connect. If the request hangs or is refused, jump to the troubleshooting section below before going further.

## Step 4: Connect from Ollama Connect on iPhone

Install [Ollama Connect](/apps/ollama-connect/) and open it. The app is a private chat client that talks directly to your own Ollama host. There are two ways to get connected:

**Automatic discovery.** Ollama Connect can search your local network for nearby Ollama servers. If your machine is on the same Wi-Fi and bound to `0.0.0.0`, it should appear in the list. Tap it to save it as a host.

**Manual entry.** If you prefer, add the host by hand using the address from Step 2, for example `http://192.168.1.42:11434`. The app supports multiple saved hosts, so you can keep your desktop, a home server, and a travel setup all configured and switch between them.

Once a host is saved, Ollama Connect shows connection diagnostics so you can confirm it is actually reachable. Pick a model, start a chat, and you will get fast streaming replies rendered with proper Markdown and code formatting. Your chats and settings stay on the phone, and nothing is routed through anyone else's servers.

## Step 5: Pick a model per chat

One nice detail: model selection is per chat. You can run a small, fast model like `llama3.2` for quick questions and switch to something heavier for a coding session, each in its own conversation with its own history. For supported vision models, you can also attach a photo or a text file directly in the chat.

If you want help choosing which models to run at home, see our roundup of the [best small LLMs to run on a home Mac](/blog/best-small-llms-to-run-on-home-mac-with-ollama/).

## Troubleshooting

**The phone can't find or reach the server.**
- Confirm both devices are on the same network and not on a "guest" Wi-Fi that isolates clients.
- Re-check that you actually restarted Ollama after setting `OLLAMA_HOST=0.0.0.0`. The variable only takes effect on a fresh start.
- Test with `curl` from another device (Step 3). If curl fails, the problem is on the server/network side, not the app.

**Connection refused.**
Your Mac or PC firewall may be blocking port 11434. On macOS, check System Settings, Network, Firewall, and allow incoming connections for Ollama. A deeper walkthrough of firewall and network config lives in our [Ollama network setup guide](/blog/ollama-setup-guide-serving-models-on-local-network/).

**It works at home but not elsewhere.**
This setup exposes Ollama on your *local* network only. Reaching it from outside your home requires a VPN back into your network, which is the safe way to do it. Do not port-forward 11434 to the open internet, since the API has no authentication.

## FAQ

### Do I need a paid cloud subscription to use this?

No. Everything runs on hardware you already own. Ollama is free and open source, the model runs on your computer, and Ollama Connect talks straight to it over your local network with no account required.

### Is my data sent to any server?

Only to the Ollama host you choose. Your chats and settings stay on your iPhone, and the prompts you send go to your own machine, not through any third-party cloud.

### What port does Ollama use?

Ollama listens on port **11434** by default. Combined with your computer's local IP, the full endpoint looks like `http://192.168.1.42:11434`.

### Can I connect over cellular when I'm away from home?

Not directly, and you should not expose the port to the public internet. The correct approach is to run a VPN into your home network, after which your phone behaves as if it were on your local Wi-Fi.

### Why can't the app see my server even though Ollama is running?

The most common cause is that Ollama is still bound to localhost. Restart it with `OLLAMA_HOST=0.0.0.0 ollama serve` and verify from another device with `curl` before trying the app again.
