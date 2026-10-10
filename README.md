# Lumen

**Lumen** is a Character.AI-style web app where you can chat with AI characters.

## Features
- Browse and chat with characters
- Create your own characters
- Persistent chats & characters (saved in your browser)
- Clean, modern dark UI inspired by Character.AI
- Ready to connect to a real LLM later

## How to run

1. Clone or download this repository
2. Open `index.html` in your browser
   (or use a simple local server: `npx serve .`)

That's it — no build step required.

## Connecting a real AI (optional)

Right now the chat uses a simple mock response so it works offline.
To connect a real model:

1. Open `app.js`
2. Find the `sendMessage` function
3. Replace the mock reply with a call to your preferred API (Grok, OpenAI, Claude, etc.)

Example structure is already commented in the code.

## Deploy

You can deploy this for free on:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

---

Made with ❤️ for character roleplay
