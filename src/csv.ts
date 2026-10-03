import type { Card, Deck } from './db'

/// CSV encoding of a deck: a header row followed by one row per card.
/// Fields are quoted when they contain commas, quotes or line breaks, per RFC 4180.
export function encodeDeck(cards: Card[]) {
  const lines = ['Front,Back', ...cards.map((c) => `${escape(c.frontText)},${escape(c.backText)}`)]
  return lines.join('\r\n') + '\r\n'
}

export function escape(field: string) {
  if (!/[",\r\n]/.test(field)) return field
  return `"${field.replaceAll('"', '""')}"`
}

/// A safe file name derived from the deck name.
export function fileName(deck: Deck) {
  const cleaned = deck.name.replace(/[/:\\?%*|"<>]/g, '').trim()
  return `${cleaned || 'Deck'}.csv`
}

export interface ParsedCard {
  front: string
  back: string
}

export interface ParseResult {
  cards: ParsedCard[]
  /// Non-blank rows that couldn't become a card (a side was missing).
  skipped: number
}

/// Parses cards from CSV or tab-separated text, as exported by Backhand,
/// spreadsheets, Anki and Quizlet. The first column is the front and the
/// second the back; any further columns (e.g. Anki tags) are ignored.
///
/// Lenient by design: the header row is optional, the separator is detected,
/// quoted fields may contain separators and line breaks, and Anki's leading
/// `#key:value` metadata lines are skipped.
export function parseCards(text: string): ParseResult {
  text = text.replace(/^﻿/, '')
  // Anki "Notes in Plain Text" files start with lines like "#separator:tab".
  text = text.replace(/^(#[^\n]*\n)+/, '')

  const rows = parseRows(text, detectSeparator(text))
  if (rows.length && isHeader(rows[0])) rows.shift()

  const cards: ParsedCard[] = []
  let skipped = 0
  for (const row of rows) {
    const front = clean(row[0])
    const back = clean(row[1])
    if (front && back) cards.push({ front, back })
    else if (front || back) skipped++
  }
  return { cards, skipped }
}

/// Trimmed, with line breaks normalised to \n as the card editor stores them.
function clean(field = '') {
  return field.replace(/\r\n?/g, '\n').trim()
}

function isHeader(row: string[]) {
  return row[0]?.trim().toLowerCase() === 'front' && row[1]?.trim().toLowerCase() === 'back'
}

/// Tab if the first line has any tabs outside quotes, otherwise comma.
/// Card text often contains commas but practically never tabs.
function detectSeparator(text: string) {
  let inQuotes = false
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes
    else if (!inQuotes && (ch === '\n' || ch === '\r')) break
    else if (!inQuotes && ch === '\t') return '\t'
  }
  return ','
}

/// RFC 4180 rows: `""` is an escaped quote inside a quoted field, and line
/// breaks may be \r\n, \n or \r.
function parseRows(text: string, separator: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const endRow = () => {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
    row = []
    field = ''
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"' && field.trim() === '') {
      // Opening quote; tolerate stray spaces before it.
      field = ''
      inQuotes = true
    } else if (ch === separator) {
      row.push(field)
      field = ''
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) endRow()
  return rows
}

/// Deck name suggested from an imported file, e.g. "Tagalog.csv" -> "Tagalog".
export function deckNameFromFile(fileName: string) {
  return fileName.replace(/\.(csv|tsv|txt)$/i, '').trim() || 'Imported Deck'
}

export function downloadDeck(deck: Deck, cards: Card[]) {
  // Leading BOM so Excel opens non-ASCII text (e.g. Tagalog accents) as UTF-8.
  const blob = new Blob(['﻿', encodeDeck(cards)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName(deck)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
