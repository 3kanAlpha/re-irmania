<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

- Use `bun` for package management.
- This website is a reimplementation of IRmania (https://ir.mgcup.net/, https://github.com/3kanAlpha/kbd-mini-ir), which was created with Nuxt, using Next.js.
- You can read the database schema in `docs/database-schema.md`.
- Implement with consideration for UI/UX when viewed from mobile environments such as smartphones.
- Do not `bun run dev` on your own initiative.