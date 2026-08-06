# AI Chat Outline - Interactive Question Navigation for AI Chats 📌

[English](README_EN.md) | [简体中文](README.md)

[![Version](https://img.shields.io/github/package-json/v/Nokic233/ai-chat-outline-extension?color=blue)](package.json)
[![Built with WXT](https://img.shields.io/badge/built%20with-WXT-red.svg)](https://wxt.dev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Browser Support](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Edge-orange.svg)](#)

**AI Chat Outline** is a lightweight, elegant, and efficient browser extension. It automatically extracts user prompts across popular AI platforms—such as **ChatGPT, Google Gemini, Kimi, Tencent Yuanbao, and Doubao**—and generates a floating, interactive outline panel on the side of the page. Click on any question in the outline to smoothly scroll and jump directly to that prompt!

---

## 🌟 Key Features

- 📌 **Real-time Question Outline**: Automatically detects and parses user prompts as you chat, updating the sidebar in real time.
- 🎯 **One-click Precise Jump**: Click any question in the outline to smoothly scroll and highlight the corresponding prompt.
- ↔️ **Collapsible Sidebar**: Easily collapse into a compact indicator bar that never blocks AI-generated responses.
- 🎨 **Native Visual Integration**: Seamlessly matches dark/light themes and blends naturally into each AI platform's UI design.
- 🔒 **Privacy First**: All text parsing is performed strictly inside your browser. Zero data collection or server uploads.
- ⚡ **Cross-platform & Multi-browser**: Built with the modern [WXT](https://wxt.dev/) extension framework, supporting Chrome, Edge, Firefox, and all Chromium/Gecko-based browsers.

---

## 🌐 Supported AI Platforms

| AI Platform | Official Website | Support Status | Notes |
| :--- | :--- | :---: | :--- |
| **Google Gemini** | [gemini.google.com](https://gemini.google.com) | ✅ Supported | Multi-turn prompt extraction |
| **ChatGPT** | [chatgpt.com](https://chatgpt.com) / [chat.openai.com](https://chat.openai.com) | ✅ Supported | Compatible with latest UI |
| **Kimi Smart Assistant** | [kimi.moonshot.cn](https://kimi.moonshot.cn) / [kimi.com](https://www.kimi.com) | ✅ Supported | Supports kimi.ai domain |
| **Tencent Yuanbao** | [yuanbao.tencent.com](https://yuanbao.tencent.com) | ✅ Supported | Latest DOM selectors supported |
| **Doubao AI** | [doubao.com](https://www.doubao.com) | ✅ Supported | Fullscreen & dialog modes supported |
| **Generic Mode** | Other AI chat pages | 🟡 Fallback | Auto-detects standard prompt containers |

---

## 🚀 Installation

### Option 1: Web Stores (Recommended)

Search and install **AI Chat Outline** directly from official web stores:

- **Chrome Web Store** (Coming soon / Publishing)
- **Microsoft Edge Add-ons** (Coming soon / Publishing)
- **Firefox Add-ons** (Coming soon / Publishing)

### Option 2: Developer Mode (Offline Installation)

1. Download the latest release `.zip` package from the [Releases](../../releases) page and extract it.
2. Open Chrome / Edge browser and navigate to the Extensions page: `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer Mode** in the top-right corner.
4. Click **Load unpacked** and select the extracted build directory (`.output/chrome-mv3` containing `manifest.json`).
5. Open any supported AI chat webpage and enjoy!

---

## 💻 Local Development & Build

If you want to contribute or build the extension from source:

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 24.0.0)
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Nokic233/ai-chat-outline-extension.git
cd ai-chat-outline-extension

# Install dependencies
npm install
```

### Development Mode

Start the development server with live-reloading:

```bash
npm run dev
```

### Production Build

```bash
# Build for Chrome (MV3)
npm run build

# Build for Firefox (MV2/MV3)
npm run build:firefox

# Package zip files
npm run zip
npm run zip:firefox
```

---

## 🛠️ Project Structure

```text
ai-chat-outline-extension/
├── entrypoints/          # Extension entrypoints (background, content script)
├── src/
│   ├── adapters/         # Selectors & scroll adapters for AI platforms
│   │   ├── chatgpt.ts
│   │   ├── gemini.ts
│   │   ├── kimi.ts
│   │   ├── yuanbao.ts
│   │   ├── doubao.ts
│   │   └── base.ts
│   ├── components/       # Floating outline panel component & styles
│   │   ├── OutlinePanel.ts
│   │   └── styles.css
│   └── types.ts          # TypeScript type definitions
├── wxt.config.ts         # WXT configuration
└── package.json
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing & Feedback

Issues and Pull Requests are welcome! Feel free to report bugs, suggest features, or add support for new AI platforms.
If you find this extension helpful, please give it a ⭐ **Star** on GitHub!
