<div align="center">

# Paper Guide for Zotero

### 在 Zotero 里读论文，随时提问，并回到论文核对答案。

Paper Guide 是一款 **Zotero 桌面版第三方插件**。它把 AI 论文问答放进 PDF 阅读流程：你可以先选中难懂的段落，也可以从论文开头开始逐步阅读；回答会尽量关联 PDF 页码，读完后还能把问答保存为 Zotero 笔记。

[![Zotero 7+](https://img.shields.io/badge/Zotero-7%2B-4B6A8A?logo=zotero&logoColor=white)](#安装)
[![Version](https://img.shields.io/badge/version-0.1.5-blue)](https://github.com/Echo-cln/zotero-paper-guide/tree/main/release)
[![License](https://img.shields.io/badge/license-AGPL--3.0--or--later-green)](LICENSE)
[![Third-party plugin](https://img.shields.io/badge/plugin-third--party-lightgrey)](#项目定位)

**[下载 Zotero 安装包](https://raw.githubusercontent.com/Echo-cln/zotero-paper-guide/main/release/Paper-Guide-0.1.5.xpi)** ·
**[查看安装包与源码包](https://github.com/Echo-cln/zotero-paper-guide/tree/main/release)** ·
**[报告问题](https://github.com/Echo-cln/zotero-paper-guide/issues)**

</div>

---

## 目录

- [项目定位](#项目定位)
- [它解决什么问题](#它解决什么问题)
- [功能一览](#功能一览)
- [安装](#安装)
- [快速开始](#快速开始)
- [配置自己的模型](#配置自己的模型)
- [一次典型的阅读流程](#一次典型的阅读流程)
- [目前能做与不能做的事](#目前能做与不能做的事)
- [隐私与数据](#隐私与数据)
- [开发与构建](#开发与构建)
- [参与项目](#参与项目)
- [许可证与声明](#许可证与声明)

## 项目定位

**Paper Guide** 是 Zotero PDF 阅读器的论文阅读助手插件。它不是一个独立的文献管理器，也不是 Zotero 官方开发或维护的功能。安装后，它通过 Zotero 插件接口向 PDF 阅读流程增加一个助手入口；Zotero 仍负责管理文献、打开 PDF 和保存原生标注。

它适合这样的阅读场景：你正在读一篇论文，遇到一个概念、公式、实验设置或论证步骤，想马上问清楚；解释之后，还希望能回到原文核对，而不是离开阅读器去另一个聊天窗口重新描述上下文。

## 它解决什么问题

普通的“把 PDF 丢给聊天机器人”通常会遇到三件麻烦事：上下文容易丢、回答不容易对应到具体原文、读完后问题和理解过程散落在聊天记录里。Paper Guide 尝试把这三步连起来：

1. **从正在阅读的论文出发**：提取当前 PDF 中可选择的文字，并按问题检索页面片段。
2. **围绕片段解释**：把检索到的内容和你的问题发送给自己配置的模型，让模型解释概念、方法和前后逻辑。
3. **回到论文检查**：回答可显示关联页码与检索片段，并尝试跳转到相应 PDF 页面。
4. **留下阅读记录**：把问答和关联片段保存到该文献的 Zotero 笔记中。

它的目标不是替你判断论文结论是否正确，而是让“提出问题—理解解释—回看证据”能在同一阅读过程中完成。

## 功能一览

| 功能           | 使用方式                                                    |
| -------------- | ----------------------------------------------------------- |
| 阅读器入口     | 在 Zotero PDF 阅读器工具栏打开 Paper Guide 面板             |
| 选区提问       | 先在 PDF 中选择文字，再打开面板；选区会作为问题上下文       |
| Guided Reading | 从论文开头开始分段阅读，可以随时追问细节                    |
| 论文问答       | 对当前 PDF 提问；插件按页面关键词匹配相关文本片段           |
| 原文回跳       | 从回答中的页码/片段尝试跳回 PDF 对应页面                    |
| Zotero 笔记    | 将本次问答和关联片段保存为该文献的子笔记                    |
| 阅读布局       | 面板可在侧栏与底栏间切换，也可收起或关闭                    |
| 论文导航       | 查看 PDF 书签目录；没有书签时尝试识别标题，并提供页面缩略图 |
| 模型配置       | 保存多组兼容 OpenAI API 的供应商配置并切换使用              |

## 安装

### 环境要求

- Zotero 桌面版 **7 或更新版本**
- 可选择文字的 PDF。扫描版 PDF 请先进行 OCR
- 可访问你所配置模型服务的网络连接

### 从 XPI 安装

1. 从 [Paper Guide 0.1.5 安装包目录](https://github.com/Echo-cln/zotero-paper-guide/tree/main/release) 下载 `Paper-Guide-0.1.5.xpi`。
2. 打开 Zotero 的 **工具 → 插件**，进入插件管理器。
3. 点击插件管理器中的齿轮菜单，选择 **Install Add-on From File… / 从文件安装插件**。
4. 选择下载的 `.xpi`，按 Zotero 提示完成安装并重启。
5. 打开或重新打开一篇 PDF，在阅读器工具栏中寻找 Paper Guide 图标。

如果安装后没有看到入口，先确认插件已启用并重启 Zotero，再关闭并重新打开 PDF 标签页。若遇到阅读器或翻译功能异常，请先在插件管理器禁用 Paper Guide 并重启 Zotero，然后通过 [Issues](https://github.com/Echo-cln/zotero-paper-guide/issues) 报告 Zotero 版本和复现步骤。

## 快速开始

### 1. 配置模型服务

打开 Paper Guide 面板中的 **模型** 标签，填写模型供应商提供的 API 地址、模型名称、协议和 API Key，然后保存。字段解释见[配置自己的模型](#配置自己的模型)。

### 2. 开始阅读

- 想从头理解论文：选择 **开始带读**，让模型先解释研究背景、问题和核心思路。
- 只卡在某一段：在 PDF 中选中段落，再点阅读器工具栏的 Paper Guide 图标，在输入框提问。
- 想继续看下一部分：在问题框直接输入你的问题；也可以继续询问术语、公式、实验设置或前后文关系。

### 3. 核对并保存

点回答中的页码/原文片段，检查它对应的论文页面。读完后选择 **保存对话到论文笔记**，在 Zotero 文献条目中查看生成的笔记。

## 配置自己的模型

Paper Guide 不附带模型或 API Key。你需要自行选择并开通模型服务，并确认服务商支持对应的 OpenAI 兼容接口。

| 配置项       | 填写内容                                                     |
| ------------ | ------------------------------------------------------------ |
| 供应商名称   | 便于辨认的名称，例如自己的云服务或 API 网关                  |
| API Base URL | 服务商文档提供的 API 根地址，通常包含 `/v1`                  |
| 模型名称     | 服务商要求的模型 ID                                          |
| 接口协议     | 当前支持 OpenAI Chat Completions 或 Responses 形式的兼容接口 |
| API Key      | 服务商签发的密钥                                             |

**Codex 说明**：当前版本是配置第三方兼容 API 的方式，不会读取 Codex 登录态或本地配置，也不会启动 Codex CLI。因此，“支持 Responses 接口”不等于“原生接入 Codex”。

## 一次典型的阅读流程

```text
打开 Zotero 中的 PDF
        ↓
选中文字，或从论文开头开始
        ↓
在 Paper Guide 中提问 / 逐段阅读
        ↓
查看回答关联的页码与片段
        ↓
跳回 PDF 核对原文
        ↓
把问答保存为该文献的 Zotero 笔记
```

## 目前能做与不能做的事

Paper Guide 当前处于**早期原型阶段**。这一区分很重要：它提供的是阅读辅助能力，不应把模型回答或页码提示直接当作论文证据。

### 当前版本可以做

- 在当前打开的 PDF 文本上进行轻量关键词检索，并把检索片段提交给配置的模型。
- 展示关联页面与片段，尝试跳转到 PDF 页并查找文本。
- 将对话与关联片段保存为 Zotero 笔记。
- 使用 Zotero 原生标注工具对 PDF 创建持久化高亮。

### 当前版本尚不支持或存在限制

- 插件**不会直接创建或保存 PDF 高亮**；需要使用 Zotero 自带的标注工具。
- 检索是页面级关键词匹配，不是语义向量检索；中文提问英文论文、跨页推理和隐含问题可能找错或漏掉内容。
- PDF 页码指文件页序，不一定等于论文印刷页码。
- 扫描版、双栏、表格和复杂公式可能造成文字缺失或顺序错误。
- 目录依赖 PDF 内嵌书签；没有书签时使用启发式标题识别，可能不完整。
- 面板和工具栏入口仍需在不同 Zotero 版本、操作系统及其他插件组合下实测；如入口不可见或其他功能异常，请先禁用插件并报告问题。
- 当前不是跨论文项目问答工具，也不提供原生 Codex 登录接入。

请始终回到论文原文核实关键结论。模型可能误读文本、漏掉限定条件，或把推断说成论文原意。

## 隐私与数据

- PDF 页面文本和你的问题会发送到你配置的模型服务，以生成回答。请先确认该服务商的数据处理政策，不要对不允许外传的文献使用云端模型。
- API Key 保存在本机 Zotero 偏好设置中；不要分享包含密钥的 Zotero 配置目录、日志或截图。
- 保存对话到笔记会把问答和关联文本写入 Zotero 文献库。请检查笔记内容后再同步或分享文献库。
- 本项目不会随安装包提供第三方模型账号或服务凭据。

## 开发与构建

### 环境

- Node.js 20 或更新版本
- npm

### 从源码构建

```bash
git clone https://github.com/Echo-cln/zotero-paper-guide.git
cd zotero-paper-guide
npm ci
npm run build
npm run lint:check
```

构建生成的 XPI 位于 `.scaffold/build/paper-guide.xpi`。开发时可运行：

```bash
npm start
```

该项目基于 Zotero Plugin Template 与 Zotero Plugin Scaffold。实机验证需要安装桌面版 Zotero；单独的构建与 lint 通过不代表 Zotero 内的交互已经验证。

## 参与项目

欢迎通过 [Issues](https://github.com/Echo-cln/zotero-paper-guide/issues) 报告缺陷、提出功能建议，也欢迎提交 Pull Request。

报告问题时请尽量提供：

- Zotero 版本、操作系统和 Paper Guide 版本；
- 从打开 PDF 开始的复现步骤；
- 预期结果与实际结果；
- 脱敏后的截图或日志。

请勿在 Issue 中上传 API Key、Cookie、私人论文全文或个人文献库数据。提交代码前请运行 `npm run build` 与 `npm run lint:check`。

## 许可证与声明

Paper Guide 使用 **AGPL-3.0-or-later** 开源，详见 [LICENSE](LICENSE)。

Paper Guide 是独立的第三方开源插件，与 Zotero 官方无隶属、合作或背书关系。Zotero 为其各自权利人的商标。
