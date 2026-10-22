# Changelog

## 0.1.5 — 2026-10-22

- Put the launch action directly in the PDF reader's top toolbar; remove the Zotero Tools menu entry.
- Redraw the Paper Guide icon with a bright book, sprout, and conversation accent.
- Make the toolbar button visibly framed and keyboard-accessible.

## 0.1.4 — 2026-10-22

- Add a persistent Zotero Tools menu entry to open the assistant for the selected reader tab.
- Keep the reader toolbar entry and give it a refined paper-and-conversation icon.
- Update installation steps to identify the Tools menu path explicitly.
- Leave Zotero's selection popup untouched to protect translation and annotation controls.

## 0.1.3 — 2026-10-22

- Remove the selection-popup injection to keep Zotero translation and annotation popups untouched.
- Open Paper Guide only from the reader toolbar and retain the last selected text for context.
- Prefer Zotero’s documented reader window when locating the PDF document and mounting the assistant.

## 0.1.2 — 2026-10-22

- Replace the template translation glyph with a paper-and-Q&A icon.
- Restore a framed, keyboard-accessible button in Zotero’s selection popup.
- Capture selected text before the popup closes and open Paper Guide on pointer or keyboard activation.

## 0.1.1 — 2026-10-22

- Match the selection action to Zotero’s neutral reader popup style.
- Open the assistant after Zotero dismisses the selection popup, preserving built-in translation and annotation controls.
- Align the assistant panel accent colors with Zotero’s restrained blue and gray palette.

## 0.1.0 — 2026-10-22

Initial early prototype.

- Add a guided-reading panel and follow-up Q&A in the Zotero PDF reader.
- Retrieve selectable PDF text by page and show page-linked source excerpts.
- Add PDF outline and page-thumbnail views.
- Save conversation evidence to a Zotero child note.
- Support multiple OpenAI-compatible Chat Completions and Responses API provider profiles.
- Add sidebar/bottom-dock layout and collapsed view.

Known limitations: no direct persistent PDF highlight creation, no native Codex CLI/config integration, lightweight keyword retrieval, and no Zotero desktop smoke test yet.
