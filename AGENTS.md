<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
## Architecture rules
- Queue state changes (status, reorder, delete) go only through DJ server functions in `src/lib/dj.functions.ts` that check the signed `mh-dj` cookie, then call security-definer RPCs with the admin client — guests can only insert/read, so the queue can't be tampered with.
- YouTube and AI calls run server-side only (`youtube.functions.ts`, `ai-suggest.functions.ts`) so API keys never reach the browser.
- UI text lives in `src/lib/i18n.tsx` (es/de/en); add every new string to all three languages.
- Queue ordering/wait-time logic lives in `src/lib/queue.ts` with tests in `queue.test.ts`.
- `/stage` owns video/audio and authorized automatic completion when external-screen mode is selected in the DJ desk; the local DJ player must stay unmounted in that mode to prevent duplicate sound and advancement.
- Stage video uses the YouTube iframe API, while live hearts read only aggregate like counts; raw guest likes are not exposed to the display.
