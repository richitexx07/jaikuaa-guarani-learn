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

- Certificates: one row per user in certificates (random code), issued only via issueCertificate after a server-side completion check; /verificar/$code is public and returns only printed fields — keeps certificates verifiable without exposing other data.
- Audio URL caching stores only successful, unexpired URLs and shares pending requests; playback failures invalidate cached players so temporary outages remain retryable without synthetic audio.
- Staff status consumers share pending-only polling through staff-status-refresh and recheck on mount, focus, and reconnect because an administrator's cache invalidation cannot reach another user's browser.
- Studio is an isolated external app (Next.js on Vercel, basePath "/studio"): the /studio root and splat server routes proxy to the fixed origin https://jaikuua-studio-app.vercel.app keeping the /studio prefix; jaikuaa.com is hosted by Lovable, so vercel.json rewrites do not apply here. Never import Next.js into Jaikuaa, never proxy other root paths, never inject admin secrets (see docs/studio-proxy.md).
- Deterministic gate: every path that marks a corpus word published/validated (updateCorpusWord, publishLevel, quickValidateWord, validateProposal) must pass requireDeterministicAcceptance/checkDeterministicAcceptance (src/lib/deterministic-gate*.ts); anything but explicit HFST acceptance blocks, including motor off — so no AI or fallback can validate malformed input.
- After-login navigation uses one stable, single-shot redirect per auth-page instance and TanStack navigation; duplicate session events must not consume the saved room destination twice.
