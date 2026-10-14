import type { Question } from '../types';

export const dataState: Question[] = [
  {
    id: 'ds-server-vs-client',
    category: 'data-state',
    level: 'mid',
    type: 'concept',
    prompt: 'What is the difference between server state and client (UI) state? Why shouldn’t API data go into Redux by default?',
    keyPoints: [
      'Server state lives remotely, is async, shared with other users and can go stale: it needs caching, deduplication, background revalidation and invalidation.',
      'Client state is owned by the UI: modal open, selected tab, form drafts, theme.',
      'Putting fetched data in a global store means re-implementing loading/error flags, caching and refetch logic by hand.',
      'Data libraries (TanStack Query, SWR, RTK Query, Apollo) handle server state; what remains for a client store is usually small.',
      'URL state (filters, pagination) is a third category.',
    ],
    sources: [
      { label: 'TkDodo — React Query as a State Manager', url: 'https://tkdodo.eu/blog/react-query-as-a-state-manager' },
      { label: 'TanStack Query — Overview', url: 'https://tanstack.com/query/latest/docs/framework/react/overview' },
    ],
  },
  {
    id: 'ds-state-choice',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt:
      'Give me your decision framework for choosing between local state, Context, Redux Toolkit, Zustand, Jotai and URL state.',
    keyPoints: [
      'Start with local state; lift it only as far as needed.',
      'URL for shareable/bookmarkable state (filters, tabs, pagination, search).',
      'Server state → a query library, not a global store.',
      'Context for low-frequency, app-wide values (theme, current user, locale) and dependency injection.',
      'Frequently updated or complex shared client state → a store with selectors (Zustand for minimal API, Redux Toolkit for conventions, middleware, devtools at scale).',
      'Atom-based (Jotai) for many small, derived, independent pieces of state.',
      'Also weigh team familiarity, SSR/RSC support, devtools and testing.',
    ],
    sources: [
      { label: 'Kent C. Dodds — Application State Management with React', url: 'https://kentcdodds.com/blog/application-state-management-with-react' },
      { label: 'Redux FAQ — When should I use Redux?', url: 'https://redux.js.org/faq/general#when-should-i-use-redux' },
      { label: 'Zustand', url: 'https://github.com/pmndrs/zustand' },
    ],
  },
  {
    id: 'ds-redux-rtk',
    category: 'data-state',
    level: 'mid',
    type: 'concept',
    prompt: 'Explain the Redux data flow. Why is Redux Toolkit the recommended way to write Redux today?',
    keyPoints: [
      'Single store; UI dispatches actions (events); pure reducers compute the next state; components subscribe via selectors.',
      'One-way data flow, predictable and debuggable (time-travel, action log).',
      'RTK: configureStore (devtools, thunk, dev checks for mutation and serialisability), createSlice (Immer lets you write "mutating" code safely), createAsyncThunk, createEntityAdapter, RTK Query.',
      'Much less boilerplate than hand-written action types and creators.',
      'Style guide: don’t mutate, keep state serialisable, normalise, model actions as events, use memoised selectors.',
    ],
    sources: [
      { label: 'Redux — Why Redux Toolkit is How To Use Redux Today', url: 'https://redux.js.org/introduction/why-rtk-is-redux-today' },
      { label: 'Redux Style Guide', url: 'https://redux.js.org/style-guide/' },
    ],
  },
  {
    id: 'ds-reducer-mutation',
    category: 'data-state',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'Items are added to the cart but the UI doesn’t update. Why?',
    codeLang: 'js',
    code: `function cartReducer(state = { items: [] }, action) {
  switch (action.type) {
    case 'cart/itemAdded':
      state.items.push(action.payload);
      return state;
    default:
      return state;
  }
}`,
    keyPoints: [
      'The reducer mutates state and returns the same reference.',
      'useSelector/connect compare references, see no change and skip re-rendering; devtools history is also corrupted.',
      'Fix: return { ...state, items: [...state.items, action.payload] }.',
      'Or use RTK createSlice, where Immer makes "mutation" safe, but only inside createSlice/createReducer.',
    ],
    sources: [
      { label: 'Redux Style Guide — Do Not Mutate State', url: 'https://redux.js.org/style-guide/#do-not-mutate-state' },
      { label: 'Redux — Immutable Update Patterns', url: 'https://redux.js.org/usage/structuring-reducers/immutable-update-patterns' },
    ],
  },
  {
    id: 'ds-normalize',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt: 'Why and how would you normalise client-side state?',
    keyPoints: [
      'Store each entity once, keyed by id ({ ids: [], entities: {} }), and reference by id elsewhere.',
      'Avoids duplication and inconsistent copies (the same user in posts and comments).',
      'O(1) lookups and updates in one place; smaller re-render surface.',
      'Denormalise with memoised selectors (reselect) for the UI.',
      'RTK createEntityAdapter; normalised caches in Apollo/Relay.',
    ],
    sources: [{ label: 'Redux — Normalizing State Shape', url: 'https://redux.js.org/usage/structuring-reducers/normalizing-state-shape' }],
  },
  {
    id: 'ds-tanstack',
    category: 'data-state',
    level: 'mid',
    type: 'concept',
    prompt: 'What does TanStack Query give you over useEffect + fetch? Explain staleTime vs gcTime.',
    keyPoints: [
      'Cache keyed by query key, request deduplication, background refetch (window focus, reconnect), retries, pagination/infinite queries, mutations with invalidation, optimistic updates, devtools, SSR hydration.',
      'staleTime: how long data is considered fresh; fresh data is served from cache without refetching (default 0).',
      'gcTime (formerly cacheTime): how long unused data stays in memory before being garbage collected (default 5 minutes).',
      'Query keys should include every variable the query depends on.',
    ],
    sources: [
      { label: 'TanStack Query — Important Defaults', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults' },
      { label: 'TkDodo — Practical React Query', url: 'https://tkdodo.eu/blog/practical-react-query' },
    ],
  },
  {
    id: 'ds-optimistic',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt: 'Implement optimistic updates for a "like" button. How do you handle failures and race conditions?',
    keyPoints: [
      'Update the UI immediately and keep a snapshot of the previous value.',
      'Send the request; on error roll back to the snapshot and tell the user.',
      'On settle, invalidate/refetch so the server stays the source of truth.',
      'Cancel in-flight refetches before the optimistic write so they don’t overwrite it.',
      'Handle rapid toggling (debounce, or send the final desired state rather than "toggle"); idempotent endpoints.',
      'React 19 useOptimistic or TanStack Query onMutate/onError/onSettled.',
    ],
    sources: [
      { label: 'TanStack Query — Optimistic Updates', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates' },
      { label: 'react.dev — useOptimistic', url: 'https://react.dev/reference/react/useOptimistic' },
    ],
  },
  {
    id: 'ds-pagination',
    category: 'data-state',
    level: 'mid',
    type: 'concept',
    prompt: 'Offset vs cursor pagination: trade-offs? How would you implement infinite scroll in React?',
    keyPoints: [
      'Offset (page=3): simple, allows jumping to a page, but items shift when data is inserted/deleted (duplicates/skips) and large offsets are slow in the database.',
      'Cursor (after=abc): stable for feeds and real-time data, efficient; no random page access.',
      'Infinite scroll: IntersectionObserver on a sentinel element, useInfiniteQuery, dedupe in-flight requests.',
      'Virtualise long lists; restore scroll position on back navigation.',
      'Accessibility: provide a "Load more" button alternative and keep the footer reachable.',
    ],
    sources: [
      { label: 'Slack Engineering — Evolving API Pagination at Slack', url: 'https://slack.engineering/evolving-api-pagination-at-slack/' },
      { label: 'MDN — Intersection Observer API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API' },
      { label: 'TanStack Query — Infinite Queries', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries' },
    ],
  },
  {
    id: 'ds-realtime',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt: 'Polling vs long polling vs Server-Sent Events vs WebSockets: when would you use each, and how do you integrate them with React state?',
    keyPoints: [
      'Polling: simplest, wasteful, delayed; fine for low-frequency data.',
      'Long polling: server holds the request until there is data; legacy fallback.',
      'SSE: one-way server → client over HTTP, built-in reconnect, text only; good for notifications and live feeds.',
      'WebSockets: bidirectional, low latency (chat, collaboration); you handle heartbeats, reconnect with backoff, auth and scaling stateful connections.',
      'Integration: push messages into the query cache (setQueryData) or a store; throttle UI updates; pause when the tab is hidden.',
    ],
    sources: [
      { label: 'MDN — WebSockets API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
      { label: 'MDN — Server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events' },
    ],
  },
  {
    id: 'ds-search-input',
    category: 'data-state',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'List every problem you can find in this search component.',
    codeLang: 'jsx',
    code: `function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/search?q=' + q)
      .then(r => r.json())
      .then(setResults);
  }, [q]);

  return (
    <>
      <input value={q} onChange={e => setQ(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>
    </>
  );
}`,
    keyPoints: [
      'A request on every keystroke: debounce (~300 ms) or use useDeferredValue.',
      'Race condition: responses arrive out of order; abort or ignore stale requests.',
      'Fires a request for an empty query on mount; no minimum length.',
      'q is not URL-encoded (encodeURIComponent or URLSearchParams).',
      'No loading, error or empty states; no res.ok check.',
      'No caching of previous queries (a query library solves this).',
      'Input has no label; results aren’t announced (combobox pattern).',
    ],
    sources: [
      { label: 'MDN — Debounce', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Debounce' },
      { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
      { label: 'MDN — URLSearchParams', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams' },
    ],
  },
  {
    id: 'ds-waterfalls',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt: 'What are request waterfalls in React apps, why do they happen, and how do you avoid them?',
    keyPoints: [
      'Requests run one after another because each component only starts fetching after its parent has rendered (fetch-on-render).',
      'Lazy-loaded code that then fetches data creates code → data waterfalls.',
      'Fixes: fetch in parallel (Promise.all, several queries at the same level), hoist data needs to route loaders (render-as-you-fetch), prefetch on hover/intent.',
      'Server Components and streaming move fetching closer to the data.',
      'Diagnose with the network panel / waterfall view.',
    ],
    sources: [
      { label: 'TanStack Query — Performance & Request Waterfalls', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls' },
    ],
  },
  {
    id: 'ds-url-state',
    category: 'data-state',
    level: 'mid',
    type: 'concept',
    prompt: 'Which state belongs in the URL, and what do you need to watch out for when you put it there?',
    keyPoints: [
      'Shareable, bookmarkable, survives refresh, and works with back/forward.',
      'Good candidates: filters, sort, pagination, search query, selected tab, open item id.',
      'Parse and validate params (they are untrusted strings); provide defaults.',
      'Use replace vs push deliberately (typing shouldn’t create a history entry per keystroke); debounce updates.',
      'Avoid putting sensitive data in URLs (logs, referrers).',
    ],
    sources: [
      { label: 'MDN — URLSearchParams', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams' },
      { label: 'TanStack Router — Search Params', url: 'https://tanstack.com/router/latest/docs/framework/react/guide/search-params' },
    ],
  },
  {
    id: 'ds-invalidation',
    category: 'data-state',
    level: 'senior',
    type: 'concept',
    prompt: 'After a mutation (e.g. renaming a project), how do you keep every screen that shows that data consistent?',
    keyPoints: [
      'Invalidate related query keys so they refetch (key factories make this systematic).',
      'Or write the mutation response directly into the cache (setQueryData) to avoid a round trip.',
      'Normalised caches (Apollo, RTK Query tags) update every view of an entity automatically.',
      'For multi-user consistency: push updates via WebSocket/SSE.',
      'Combine with optimistic updates where latency matters.',
    ],
    sources: [
      {
        label: 'TanStack Query — Invalidations from Mutations',
        url: 'https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations',
      },
    ],
  },
];
