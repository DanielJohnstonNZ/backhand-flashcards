# Backhand

A simple, free flash card app. No accounts, no subscriptions, no paywalls.
Make decks, add cards, review them.

Backhand is a progressive web app: it works offline and can be installed to
your home screen or dock from the browser. There is no server. Decks and cards
are stored in your browser's IndexedDB, so they stay on that device and in that
browser. Export decks to CSV to back them up, and import CSV to restore them or
bring cards in from spreadsheets.

## Development

Requires Node 22 or later.

```sh
npm install
npm run dev       # development server
npm run build     # static site in dist/
npm run preview   # serve the production build (service worker enabled)
```

