# Backhand

A simple, free flash card app. No accounts, no subscriptions, no paywalls.
Make decks, add cards, review them.

**Use it:** https://danieljohnstonnz.github.io/backhand-flashcards/

Backhand is a progressive web app: it works offline and can be installed to
your home screen or dock from the browser. There is no server. Decks and cards
are stored in your browser's IndexedDB, so they stay on that device and in that
browser. Export decks to CSV to back them up, and import CSV to restore them or
bring cards in from spreadsheets, Anki or Quizlet.

## Development

Requires Node 22 or later.

```sh
npm install
npm run dev       # development server
npm run build     # static site in dist/
npm run preview   # serve the production build (service worker enabled)
```

The service worker only runs on `localhost` or over HTTPS.

Pushing to `master` builds the app and deploys it to GitHub Pages
(`.github/workflows/deploy.yml`).

## Layout

```
src/
  main.tsx                 Entry point; opens storage, registers the service worker
  App.tsx                  Sidebar + detail shell (one pane at a time on phones)
  db.ts                    IndexedDB storage, in-memory snapshot, useStore hook
  route.ts                 Hash routes: #/, #/deck/<id>, #/deck/<id>/review
  csv.ts                   CSV export and lenient CSV/TSV import parsing
  components/
    DeckList.tsx           Create, rename, import, export and delete decks
    DeckDetail.tsx         Card list and review button
    CardEditor.tsx         New / edit card, with "save and add another"
    ImportDialog.tsx       Pick a file, preview the cards, add them to a new or existing deck
    Review.tsx             Shuffled flip-card review with a summary screen
    Modal.tsx              <dialog> wrapper, name prompt and confirm dialogs
```
