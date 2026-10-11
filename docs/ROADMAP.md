# Roadmap

Known limitations, open decisions and the recommended next steps.

## Known limitations
- Question banks are small (3 to 20 per course), so long practice exams repeat questions. The simulator caps the count and says why. Small banks also limit the games in [GAMES.md](GAMES.md).
- Progress lives in one browser. Export and restore are the only way to move it.
- Study time counts only sessions started with the timer.
- Reminders are in-app only, with no push notifications.
- External credentials are self-reported, and the app cannot verify them.
- There is no AI tutor provider yet, only the interface.

## Open decisions
1. **Name clearance:** check `poqeni.com` / `poqeni.ai` with a registrar and search USPTO. Nothing has been checked or registered yet. The mascot shares the name poqeni.
2. **Tagline:** keep "Learn. Build. Certify." or adopt one of the alternatives.
3. **Hosting:** the app is a static site, so any static host works (GitHub Pages, Netlify, Cloudflare Pages). No host has been chosen.
4. **AI tutor:** whether to add one. It would need a small server to hold the API key.
5. **Games scope:** which of the games in [GAMES.md](GAMES.md) to build first. The recommended order is at the end of that document.

## Recommended next steps (in order)
1. Grow the AWS AIF-C01 and Microsoft AI-901 question banks to about 60 questions each, then the others. This is the main content gap, and the games need it too.
2. Add a second lesson to each vendor course.
3. Re-verify the catalog facts by 2027-01-08, and try to confirm the unverified items in [CATALOG.md](CATALOG.md).
4. Run a screen-reader pass, and test in Safari and Firefox.
5. Build the games in [GAMES.md](GAMES.md), starting with the shared foundation.
