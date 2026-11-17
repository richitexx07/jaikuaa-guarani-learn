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
- Deterministic gate: the motor only gives an opinion. checkDeterministicAcceptance may be shown next to a word (GateNotice: «Opinión del motor (en desarrollo)… La decisión es del docente.»), but it must never block or approve updateCorpusWord, publishLevel, quickValidateWord or validateProposal — human teachers decide. Do not re-add requireDeterministicAcceptance to those paths.
- After-login navigation uses one stable, single-shot redirect per auth-page instance and TanStack navigation; duplicate session events must not consume the saved room destination twice.
- SEO: each content route owns its page-specific head metadata; the root holds sitewide defaults only, and canonical links belong on leaf routes to avoid concatenated duplicates.
- Fixed-light postulation sections scope their form color tokens locally through `postulation-light` so dark page preferences cannot make editable text invisible on light surfaces.
- Modo mostrador (/mostrador, table mostrador_frases): the team only loads Spanish phrases; Guaraní is written by an editor/admin and published only with a human recording and validation by a different person (server check + DB constraint). Users only receive published rows; never fill gn or audio automatically.
- Aula (/aula, /aula/docente, /aula/$id; tables aulas, aula_miembros, aula_tareas, aula_docentes): students join only with the teacher's code; teachers (admin, editor or admin-approved aula_docentes) see names and progress, never emails. Progress is derived from xp_transactions (lesson "guarani:n" any time; game slug after the task was assigned). All writes go through server functions; RLS policies must not cross-reference these tables (avoids recursion).
- Payments: Pagopar via pagos.functions.ts + /api/public/pagopar (token sha1(private+hash) verified before any write); access is granted only by that verified notice. Without PAGOPAR_PUBLIC_KEY/PAGOPAR_PRIVATE_KEY it runs in test mode where only admins can simulate a purchase — keeps real money flows behind the provider's confirmation.
- Local penalties keeper buttons use KEEPER_DIVES from physics so all six side/height combinations remain reachable and tested against shot resolution.
- Approved translations (corpus_words.significados, applied by localizarVocab) are display-only: `es` holds the reader's language and `orig` the Spanish, so anything that *identifies* a word — body-part region matching, pool dedupe, glossary search, distractor exclusion — must key on castellano() from src/lib/significado.ts or on `gn`, never on the translated `es`; otherwise rounds silently disappear or two options become equally correct when the app is not in Spanish.
- The signed-in learning home scopes its visual tokens to `.learning-home`, reuses existing lesson/goal stores, and opens Jai from an inline header control rather than a floating launcher so learning content remains unobstructed.
- Progress integrity: recordActivity ignores client xp (SERVER_XP table, lesson xp from lesson_words, exam xp/perfect from server grading of answers against the static quiz bank); new Guaraní lessons and reto results need an HMAC ticket from src/lib/intento.ts (issued by getCourseLesson/verReto, minimum elapsed time, single use via sync_id) so the phone cannot award itself points, certificates or badges.
