import { useSyncExternalStore } from 'react'

/// Hash-based routes, so the app works as static files from any host and the
/// browser / Android back button behaves:
///   #/                   deck list
///   #/deck/<id>          deck detail
///   #/deck/<id>/review   review session
export interface Route {
  deckId?: string
  reviewing?: boolean
}

function parse(hash: string): Route {
  const match = hash.match(/^#\/deck\/([^/]+)(\/review)?$/)
  if (!match) return {}
  return { deckId: match[1], reviewing: !!match[2] }
}

export function routeHash(route: Route) {
  if (!route.deckId) return '#/'
  return `#/deck/${route.deckId}${route.reviewing ? '/review' : ''}`
}

export function navigate(route: Route, { replace = false } = {}) {
  const hash = routeHash(route)
  if (replace) history.replaceState(null, '', hash)
  else history.pushState({ inApp: true }, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/// Pops back if the current entry was pushed by `navigate`, otherwise (e.g.
/// the page was opened at this URL) replaces it with `fallback`.
export function goBack(fallback: Route) {
  if (history.state?.inApp) history.back()
  else navigate(fallback, { replace: true })
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parse(hash)
}
