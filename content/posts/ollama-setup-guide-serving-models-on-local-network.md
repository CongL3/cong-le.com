---
title: "Ollama Setup Guide: Serving Models on Your Local Network"
description: "A complete OLLAMA_HOST setup guide: bind Ollama to your network, open the firewall, verify with curl on port 11434, and connect from iOS."
slug: ollama-setup-guide-serving-models-on-local-network
app: ollama-connect
keywords: ["ollama network setup", "OLLAMA_HOST", "ollama serve local network"]
queue: 15
status: queued
publishDate:
---

> **Quick answer:** To serve Ollama on your local network, set `OLLAMA_HOST=0.0.0.0` and restart the server (`OLLAMA_HOST=0.0.0.0 ollama serve`) so it listens on every interface instead of only localhost, then allow inbound TCP on port 11434 through your firewall. Verify from another device with `curl http://YOUR_IP:11434/api/tags`; a JSON list of models confirms it works. The API has no authentication, so keep it on your LAN and use a VPN for remote access rather than exposing port 11434 to the internet.

Out of the box, Ollama is a single-machine tool. It listens only on localhost, which is perfect for privacy but useless the moment you want to reach your models from another device. This guide covers the full path to serving Ollama on your local network: binding the server correctly with `OLLAMA_HOST`, getting through the firewall, verifying the endpoint with `curl`, and finally connecting from an iPhone. Each step includes how to confirm it actually worked, so you are never guessing.

## The one variable that matters: OLLAMA_HOST

Ollama's network behavior is controlled by the `OLLAMA_HOST` environment variable. By default it is effectively `127.0.0.1:11434`, meaning it only accepts connections originating from the same machine. This binding and the `OLLAMA_HOST` override are both documented in Ollama's official FAQ under "How can I expose Ollama on my network?" To serve other devices, you bind it to all network interfaces:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

The `0.0.0.0` address means "listen on every interface," so requests arriving over Wi-Fi or Ethernet are accepted. The port stays at the default **11434** unless you change it.

A common mistake is setting the variable but not restarting the server. The value is read at startup, so if Ollama was already running, quit it completely first. On macOS that means quitting the menu bar app; the background service will not pick up a new value while it is still alive.

### Making it persistent on macOS

If you want the desktop app to always bind this way, set the variable at the launch-agent level and relaunch:

```bash
launchctl setenv OLLAMA_HOST "0.0.0.0"
```

Then quit and reopen Ollama. On Linux running under systemd, add an override:

```bash
sudo systemctl edit ollama
```

and inside the editor add:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

Save, then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## Find the server's address

Other devices need your machine's IP on the LAN. Do not use `localhost` or `127.0.0.1` from the phone; those point at the phone itself.

```bash
ipconfig getifaddr en0        # macOS, Wi-Fi
hostname -I | awk '{print $1}' # Linux
```

You will get something like `192.168.1.42`. Your full endpoint is `http://192.168.1.42:11434`. Note it down.

## Open the firewall

Binding to `0.0.0.0` is only half the battle. The operating system firewall may still block incoming connections on port 11434.

**macOS.** Go to System Settings, Network, Firewall. If the firewall is on, either allow incoming connections for the Ollama application, or temporarily disable the firewall to test. macOS prompts to allow incoming connections the first time an app tries to accept them, so watch for that dialog when you start `ollama serve`.

**Linux with ufw.** Allow the port on your local subnet only, which is safer than opening it to everything:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 11434 proto tcp
```

**Windows.** Add an inbound rule for TCP port 11434 in Windows Defender Firewall, scoped to your private network profile.

## Verify with curl before anything else

This is the step people skip and then spend an hour debugging the wrong thing. Before you touch a phone or any client app, prove the endpoint is reachable across the network. From a *different* device on the same LAN:

```bash
curl http://192.168.1.42:11434/api/tags
```

A JSON object listing your installed models means the server is bound, the firewall is open, and the network path is clear. If you want to test generation end to end:

```bash
curl http://192.168.1.42:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Reply with the single word: working",
  "stream": false
}'
```

If both succeed, every layer between another device and your model is confirmed working. Any client will now connect.

### If curl fails

- **Connection refused:** the server is not listening on that interface (re-check `OLLAMA_HOST` and that you restarted) or the firewall is blocking the port.
- **Hangs then times out:** almost always the firewall, or the two devices are on different subnets or an isolating "guest" network.
- **Works with localhost but not the IP:** you did not restart after setting `OLLAMA_HOST=0.0.0.0`. This is the single most common cause.

## Connect from iOS

With curl confirming the endpoint, connecting a phone is trivial. Install [Ollama Connect](/apps/ollama-connect/) and either let it discover the server on your local network automatically or add the host manually with `http://192.168.1.42:11434`. The app shows connection diagnostics so you can see the host is healthy, then lets you pick a model per chat and stream responses that render Markdown and code cleanly. Everything stays on your device; nothing routes through a third party.

If you are setting this up for the first time, the companion post [how to chat with Ollama from your iPhone](/blog/how-to-chat-with-ollama-from-your-iphone/) walks through the phone side in detail, and the [private LLM at home](/blog/run-llm-locally-use-from-phone/) piece covers the privacy and cost reasoning.

## A security note

Serving Ollama on your *local* network is reasonable because you control who is on it. The API has **no authentication**, so anyone who can reach port 11434 can use your models and read anything you send. That is why you should never port-forward 11434 to the public internet. To reach your models when away from home, run a VPN into your network instead; your phone then behaves as a local device and the same protections apply.

## FAQ

### What does OLLAMA_HOST=0.0.0.0 actually do?

It tells Ollama to listen on every network interface instead of only localhost, so other devices on your network can connect. The listening port remains 11434 by default. The change takes effect only after you restart the Ollama server.

### Which port does Ollama listen on?

Port 11434 by default. You can override it by including a port in `OLLAMA_HOST`, for example `OLLAMA_HOST=0.0.0.0:11500`, but most setups leave it at 11434.

### Why does localhost work but my IP address doesn't?

The most likely reason is that Ollama is still bound to localhost from a previous start. Fully quit and restart it with `OLLAMA_HOST=0.0.0.0 ollama serve`. If it still fails, the operating system firewall is blocking incoming connections on port 11434.

### Is it safe to expose Ollama to the internet?

No. The API has no authentication, so exposing port 11434 publicly lets anyone use your models. Keep it on your local network and use a VPN for remote access.

### How do I confirm the server is reachable from another device?

Run `curl http://YOUR_IP:11434/api/tags` from a different machine on the same network. A JSON list of models confirms the binding, firewall, and network path are all working before you try any client app.
