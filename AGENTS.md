# Prototype Instructions

## Library dashboard scope

- The user owns frontend work only. Keep business backend changes outside this project task.
- The selected default design is Figma file `68t5khLkCA9gmKAdpg6QEq`, full-screen node `2005:331`; `23:697` is only the campus image inside it.
- The user has authorized all frontend steps: module movement/resizing, visibility, content editing, preview, undo/redo, draft/published browser persistence, and portable backups. No backend API exists yet; real backend integration remains pending.
- Latest approved change: replace the search-keyword half-donut with a colorful word cloud, using font size to show heat, and editable words/values/colors. The user's 304 × 252 reference is the visual target for this module; preserve the surrounding Figma design.
- Preserve the original university branding, pale blue background, green headings, images, and default 2560 × 1440 layout.
- Latest layout decision (2026-10-19): fixed positions supplied by reusable templates. Provide multiple variants for 2, 3, 4, 5, and 6 components, grounded in the user's `大数据展示平台模板.pptx` slides 2–9. Operators select a template and choose one component for each fixed slot. Template geometry stays locked; switching components must not move/resize slots. Keep free layout as a separate optional mode and preserve stored content and published screens.
- Latest design decision (2026-11-04): use the original dashboard design from Gitee `master` and remove the later Mijobello-inspired screen. Preserve the original editor and existing browser data. The user is building a large-screen display and does not currently require mobile adaptation or mobile testing.
- Header refinement (2026-11-04): remove the central title banner and weather display; keep the university logo and show only Beijing time and date in a scrolling header. Preserve existing stored content for compatibility.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
