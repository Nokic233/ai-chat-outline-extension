# AI Chat Outline - 对话提问大纲导航 📌

[![Version](https://img.shields.io/badge/version-1.0.16-blue.svg)](package.json)
[![Built with WXT](https://img.shields.io/badge/built%20with-WXT-red.svg)](https://wxt.dev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Browser Support](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Edge-orange.svg)](#)

**AI Chat Outline** 是一款轻量、优雅且高效的浏览器扩展插件。它能够自动提取 **ChatGPT、Gemini、Kimi、腾讯元宝、豆包** 等主流 AI 平台对话中的用户提问，并在页面侧边实时生成交互式提问大纲。点击大纲项目即可瞬间平滑滚动定位至对应问题，让长对话浏览更轻松、导航更高效！

---

## 🌟 核心特性

- 📌 **实时提问大纲**：自动监听并解析对话内容，随着新提问的增加实时更新右侧大纲。
- 🎯 **一键精准定位**：点击大纲中的任意问题标题，页面平滑滚动并高亮定位到对应问答位置。
- ↔️ **侧边栏折叠/展开**：支持一键收起为悬浮图标，极简不占屏，不遮挡 AI 生成的内容。
- 🎨 **原生视觉融入**：完美适配 dark/light 主题，与各个 AI 平台的界面设计融为一体。
- 🔒 **隐私安全保障**：所有文本解析均在本地浏览器端完成，无任何后台数据收集或上传，安全可靠。
- ⚡ **跨平台与多浏览器**：基于现代 [WXT](https://wxt.dev/) 扩展框架打造，支持 Chrome、Edge、Firefox 等所有主流 Chromium 与 Gecko 内核浏览器。

---

## 🌐 已适配 AI 平台

| AI 平台                | 官方网址                                                                        |  支持状态   | 备注                     |
| :--------------------- | :------------------------------------------------------------------------------ | :---------: | :----------------------- |
| **Google Gemini**      | [gemini.google.com](https://gemini.google.com)                                  | ✅ 完全支持 | 支持多轮提问抽取         |
| **ChatGPT**            | [chatgpt.com](https://chatgpt.com) / [chat.openai.com](https://chat.openai.com) | ✅ 完全支持 | 兼容最新 UI              |
| **Kimi 智能助手**      | [kimi.moonshot.cn](https://kimi.moonshot.cn) / [kimi.com](https://www.kimi.com) | ✅ 完全支持 | 支持 kimi.ai 域名        |
| **腾讯元宝**           | [yuanbao.tencent.com](https://yuanbao.tencent.com)                              | ✅ 完全支持 | 支持最新 DOM 结构        |
| **豆包 AI**            | [doubao.com](https://www.doubao.com)                                            | ✅ 完全支持 | 支持全屏/对话模式        |
| **通用模式 (Generic)** | 其他 AI 对话页面                                                                | 🟡 基础支持 | 自动尝试识别标准提问节点 |

---

## 🚀 安装指南

### 方式一：商店安装（推荐）

你可以直接前往对应的浏览器扩展商店搜寻并安装 **AI Chat Outline**：

- **Chrome Web Store**（即将上架/升级中）
- **Microsoft Edge Add-ons**（即将上架/升级中）
- **Firefox Add-ons**（即将上架/升级中）

### 方式二：开发者模式安装（离线安装）

1. 前往 GitHub 的 [Releases](../../releases) 页面下载最新发布的 `zip` 包并解压。
2. 打开 Chrome / Edge 浏览器，导航至扩展管理页面：`chrome://extensions/` 或 `edge://extensions/`。
3. 在右上角开启 **“开发者模式” (Developer Mode)**。
4. 点击 **“加载已解压的扩展程序” (Load unpacked)**，选择解压出来的目录（包含 `manifest.json` 的 `.output/chrome-mv3` 目录）。
5. 刷任意支持的 AI 对话网页即可使用！

---

## 💻 本地开发与构建

如果你希望参与贡献或自己编译构建插件，请参考以下指南：

### 前置要求

- [Node.js](https://nodejs.org/) (>= 24.0.0)
- npm / pnpm / yarn

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/Nokic233/ai-chat-outline-extension.git
cd ai-chat-outline-extension

# 安装依赖
npm install
```

### 开发调试

运行开发服务器，WXT 会自动启动带有扩展程序的干净浏览器窗口：

```bash
npm run dev
```

### 打包构建

```bash
# 构建 Chrome (MV3) 生产包
npm run build

# 构建 Firefox (MV2/MV3) 生产包
npm run build:firefox

# 打包 Zip 预发布文件
npm run zip
npm run zip:firefox
```

---

## 🛠️ 项目结构

```text
ai-chat-outline-extension/
├── entrypoints/          # 插件入口点 (background, content script)
├── src/
│   ├── adapters/         # 各大 AI 平台的选择器与定位适配器
│   │   ├── chatgpt.ts
│   │   ├── gemini.ts
│   │   ├── kimi.ts
│   │   ├── yuanbao.ts
│   │   ├── doubao.ts
│   │   └── base.ts
│   ├── components/       # 悬浮大纲面板组件与样式
│   │   ├── OutlinePanel.ts
│   │   └── styles.css
│   └── types.ts          # 类型定义
├── wxt.config.ts         # WXT 配置文件
└── package.json
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 协议开源。欢迎自由使用、修改和分发。

---

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request 来增加新的 AI 平台适配、修复 Bug 或提出改进建议！
如果觉得好用，请给这个项目点个 ⭐ **Star** 支持一下吧！
