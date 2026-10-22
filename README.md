# Paper Guide for Zotero

> **Paper Guide 是为 Zotero 桌面版开发的 PDF 阅读辅助插件。** 它把逐步带读、基于当前论文的问答和原文定位放进 Zotero 阅读器中，让你可以边读边问，再回到论文核对答案。
>
> Paper Guide 是独立的第三方开源项目，与 Zotero 官方无隶属或背书关系。它通过 Zotero 插件接口扩展阅读器，不是 Zotero 官方插件。

**项目状态：早期原型（0.1.2）** · **目标平台：Zotero 7 桌面版及以上** · **界面：简体中文**

## 你可以用它做什么

- **跟着论文逐步读**：从摘要和引言开始，一次解释一个阶段；你可以随时停下来追问术语、方法、公式或论证关系。
- **围绕当前论文提问**：插件从打开的 PDF 提取可选择的文本，按问题检索相关页面片段，再交给你配置的模型回答。
- **回到证据原文**：回答展示 PDF 页码和原文片段。点击引用后，阅读器跳到对应页并查找引用内容，方便对照核验。
- **从选区直接发问**：在 PDF 中选中文字后，使用 Zotero 阅读器中的 Paper Guide 入口，直接询问这段原文。
- **保留阅读成果**：把问答和引用片段保存为 Zotero 文献条目下的子笔记；也可以让模型归纳本次问答中的关键问题、结论和待解决疑问。
- **按习惯安排阅读界面**：在右侧栏与底部面板之间切换，收起面板，或查看 PDF 目录和页面缩略图。
- **连接自己的模型供应商**：保存多组兼容 OpenAI API 的供应商、模型、接口协议和 API Key，并在阅读时切换。

## 安装

1. 下载仓库中的 [Paper Guide 0.1.2 安装包](release/Paper-Guide-0.1.2.xpi)。后续版本会在 [Releases](https://github.com/Echo-cln/zotero-paper-guide/releases) 页面发布。
2. 打开 Zotero，在菜单中选择 **工具 → 插件**（Tools → Add-ons）。
3. 打开插件管理器的齿轮菜单，选择 **Install Add-on From File…**（从文件安装插件），选中下载的 `.xpi` 文件。
4. 按 Zotero 提示重启后，打开一篇 PDF。在 PDF 阅读器工具栏点击 **Paper Guide**。
5. 打开 **模型** 标签，填写供应商名称、API Base URL、模型名称、接口协议和 API Key，然后点击保存。

如果 Zotero 阻止安装，请先确认所下载文件是 `.xpi` 插件包，并检查 Zotero 版本是否为 7 或更新版本。

## 配置模型

在插件的 **模型** 标签中添加并保存供应商配置：

| 配置项       | 填写内容                                                  |
| ------------ | --------------------------------------------------------- |
| 供应商名称   | 自定义名称，例如 OpenRouter、硅基流动或自己的网关         |
| API Base URL | 供应商提供的兼容接口地址；通常以 `/v1` 结尾               |
| 模型名称     | 供应商要求的模型 ID                                       |
| 接口协议     | 选择供应商支持的 OpenAI Chat Completions 或 Responses API |
| API Key      | 供应商签发的密钥                                          |

请以模型供应商的文档为准填写 URL、模型 ID 和协议。API Key 当前保存在本机 Zotero 配置中，**不会被加入论文笔记或项目源码**；本地配置仍属于敏感信息，请勿随意分享 Zotero 配置目录或录屏展示密钥。

### Codex 接入说明

兼容 Responses API 的第三方网关可以尝试通过 **OpenAI Responses** 协议连接。这个选项只表示 API 协议兼容，**不等于 Codex 原生接入**。当前版本不会启动 Codex CLI，也不会读取 `~/.codex/config.toml` 或使用 Codex 登录态。原生 Codex/本地桥接适配器仍在后续开发范围内。

## 阅读流程

1. 在 PDF 中选中一段文字并点击 Zotero 的 Paper Guide 选项，或点击阅读器工具栏按钮打开面板。
2. 点击 **开始带读**，让助手先带你读论文开头。它会逐步解释并等待你的追问，不要求一次讲完整篇论文。
3. 在输入框继续追问；点击回答中的页码引用，跳回 PDF 核对原文。
4. 阅读完后，点击 **保存对话到论文笔记**，或根据本次问答生成总结。
5. 要创建 Zotero 可持久保存的 PDF 高亮，请使用 Zotero 自带的高亮工具。Paper Guide 可以帮助定位选区，目前不会直接创建 PDF 高亮标注。

## 当前限制

- **早期原型**：已完成构建和静态代码检查，但尚未在 Zotero 桌面版中完成实机安装与全流程验证。欢迎通过 Issues 报告问题。
- **PDF 文本要求**：当前依赖 PDF 中可选择的文字。扫描版 PDF 需要先 OCR；公式、表格和双栏排版也可能造成提取顺序或检索结果不准确。
- **检索能力**：当前使用轻量级页面关键词匹配，不是完整的向量检索系统；对于隐含问题、跨页推理和公式密集内容可能漏检。请通过原文引用核验结论。
- **页码含义**：引用页码是 PDF 文件中的页序号，可能与期刊印刷页码不同。
- **目录与缩略图**：优先读取 PDF 内嵌书签；没有书签时使用启发式标题识别。当前最多预览前 18 页。
- **PDF 高亮**：插件提供原文定位，持久化高亮由 Zotero 原生工具完成。
- **模型连接**：Zotero 必须能够访问供应商 API；网关的 CORS、网络策略或接口协议不兼容时，请求可能失败。
- **Codex 原生适配**：暂未实现，详见上文。

## 常见问题

### 提示“无法读取当前 PDF”

请确认当前打开的是 Zotero 内置 PDF 阅读器中的 PDF，并等待页面完成加载。如果问题仍然出现，请在 GitHub Issues 中附上 Zotero 版本、操作步骤和错误截图；不要附上 API Key 或含有私人论文内容的日志。

### 提示“请先在模型设置中填写 API Key”

在 **模型** 标签输入 API Key，点击 **保存供应商设置** 后再提问。切换供应商后也请检查当前选中的配置是否完整。

### 请求失败或返回 HTTP 错误

检查 API Base URL、模型名称、密钥和协议是否符合供应商文档，并确认 Zotero 所在网络可以访问该接口。请勿在公开 Issue 中粘贴密钥。

### 没有目录或页面缩略图

部分 PDF 没有嵌入书签。没有书签时插件会尝试从页面标题生成目录；无法识别时仍可使用页面列表和缩略图定位。

## 从源码构建

需要 Node.js 20 或更新版本，以及 npm。

```bash
git clone https://github.com/Echo-cln/zotero-paper-guide.git
cd zotero-paper-guide
npm ci
npm run build
```

构建结果位于 `.scaffold/build/paper-guide.xpi`。通过 **工具 → 插件 → 齿轮菜单 → Install Add-on From File…** 安装该文件。

开发检查：

```bash
npm run lint:check
```

## 参与改进

欢迎提交 Bug 报告、功能建议和代码贡献。提交问题时请包括 Zotero 版本、操作步骤、预期结果和实际结果；请先移除 API Key、个人目录、论文全文及其他敏感信息。

开始贡献前建议先查看 [Issues](https://github.com/Echo-cln/zotero-paper-guide/issues) 和 [Contributing](CONTRIBUTING.md)。

## 致谢与许可

Paper Guide 使用 [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template) 与 Zotero Plugin Scaffold 作为开发基础，并保留项目中的 AGPL-3.0-or-later 许可证。Paper Guide 不由 Zotero 官方开发、维护或背书；Zotero 是其各自权利人的商标。
