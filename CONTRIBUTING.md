# Contributing to Paper Guide

Thanks for helping improve this Zotero reader plugin.

## Before opening an issue

- Check whether the issue already exists.
- Include your Zotero version, operating system, steps to reproduce, expected behavior, and actual behavior.
- Remove API keys, access tokens, local file paths, private paper content, and personal library data from screenshots and logs.

## Development setup

1. Install Node.js 20+ and npm.
2. Clone the repository and run `npm ci`.
3. Build the plugin with `npm run build`.
4. Run formatting and lint checks with `npm run lint:check`.
5. Install `.scaffold/build/paper-guide.xpi` in a separate Zotero test profile before testing reader behavior.

## Pull requests

- Keep changes focused and explain the user-visible behavior they improve.
- Update `README.md` and `CHANGELOG.md` when behavior, installation, or limitations change.
- Run `npm run build` and `npm run lint:check` before submitting.
- Do not commit `.env`, Zotero profile data, API keys, or private PDFs.

Paper Guide is an independent third-party Zotero plugin and is not affiliated with or endorsed by Zotero.
