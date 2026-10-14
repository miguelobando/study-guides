import type { Question } from '../types';

export const reactAdvanced: Question[] = [
  {
    id: 'ra-fiber',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'What is React Fiber, and why did React rewrite its reconciler?',
    keyPoints: [
      'Fiber is both the reconciler (React 16+) and the data structure: one fiber per component instance, linked via child/sibling/return pointers.',
      'The old stack reconciler was recursive and synchronous; once it started, it could not stop.',
      'Fiber splits rendering into units of work that can be paused, resumed, prioritised (lanes) or thrown away.',
      'Double buffering: a "current" tree and a "work-in-progress" tree, swapped at commit.',
      'It is the foundation for concurrent features: transitions, Suspense, selective hydration.',
    ],
    sources: [
      { label: 'Andrew Clark — React Fiber Architecture', url: 'https://github.com/acdlite/react-fiber-architecture' },
      { label: 'React 18 release — What is Concurrent React?', url: 'https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react' },
    ],
  },
  {
    id: 'ra-concurrent',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt:
      'What is concurrent rendering? Explain useTransition and useDeferredValue with a real use case, and how they differ from debouncing.',
    keyPoints: [
      'Rendering becomes interruptible: urgent updates (typing, clicking) can interrupt non-urgent ones.',
      'startTransition / useTransition marks a state update as non-urgent and exposes isPending (e.g. switching tabs, filtering a big list).',
      'useDeferredValue gives a lagging copy of a value; heavy children render with the old value while React prepares the new one in the background.',
      'Unlike debounce there is no fixed delay: work starts immediately and is abandoned if a newer update arrives; fast devices feel instant.',
      'Updates that control an input’s value cannot be transitions.',
      'Inside a transition, already-revealed content is not replaced by a Suspense fallback.',
    ],
    sources: [
      { label: 'react.dev — useTransition', url: 'https://react.dev/reference/react/useTransition' },
      { label: 'react.dev — useDeferredValue', url: 'https://react.dev/reference/react/useDeferredValue' },
    ],
  },
  {
    id: 'ra-suspense',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'How does Suspense work? What can suspend, and how do you design Suspense boundaries?',
    keyPoints: [
      'A Suspense boundary shows its fallback while any child is suspended (waiting for code or data).',
      'Things that suspend: React.lazy components, use(promise), Suspense-enabled frameworks/libraries (Next.js, Relay, TanStack Query suspense mode).',
      'Data fetched inside useEffect does NOT trigger Suspense.',
      'Nested boundaries give progressive reveal; place them where a loading state makes sense for the user.',
      'Transitions keep already visible content instead of falling back.',
      'Streaming SSR sends HTML per boundary as it becomes ready.',
    ],
    sources: [
      { label: 'react.dev — <Suspense>', url: 'https://react.dev/reference/react/Suspense' },
      { label: 'react.dev — use', url: 'https://react.dev/reference/react/use' },
    ],
  },
  {
    id: 'ra-error-boundary',
    category: 'react-advanced',
    level: 'mid',
    type: 'concept',
    prompt: 'What are error boundaries, how do you implement one, and which errors do they NOT catch?',
    keyPoints: [
      'A class component with static getDerivedStateFromError (render fallback) and/or componentDidCatch (log).',
      'Catches errors thrown while rendering, in lifecycle methods and constructors of the subtree.',
      'Does not catch: event handlers, async code (setTimeout, promises), server rendering errors, or errors in the boundary itself.',
      'No hook equivalent; react-error-boundary is the common wrapper (with reset keys).',
      'Place boundaries at app, route and widget level; report to monitoring.',
      'React 19 adds root options onCaughtError / onUncaughtError.',
    ],
    sources: [
      {
        label: 'react.dev — Catching rendering errors with an error boundary',
        url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
      },
      { label: 'react-error-boundary', url: 'https://github.com/bvaughn/react-error-boundary' },
    ],
  },
  {
    id: 'ra-portals',
    category: 'react-advanced',
    level: 'mid',
    type: 'concept',
    prompt: 'What are portals used for? How do context and events behave inside a portal?',
    keyPoints: [
      'createPortal(children, domNode) renders into a different DOM node, e.g. document.body.',
      'Used for modals, tooltips, popovers and toasts to escape overflow: hidden and z-index stacking contexts.',
      'The portal stays in the React tree: it still receives context from its React parents.',
      'Events bubble through React ancestors, not DOM ancestors.',
      'Accessibility (focus management, aria-modal) is still your responsibility.',
    ],
    sources: [{ label: 'react.dev — createPortal', url: 'https://react.dev/reference/react-dom/createPortal' }],
  },
  {
    id: 'ra-hydration',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'What is hydration, what causes hydration mismatches, and how do you fix them?',
    keyPoints: [
      'Hydration attaches React (event handlers, state) to HTML rendered on the server.',
      'The first client render must produce the same output as the server.',
      'Common causes: Date.now()/Math.random(), typeof window branches, locale/time-zone formatting, invalid HTML nesting (<div> inside <p>), browser extensions altering the DOM.',
      'Fixes: render deterministically; move client-only values into an effect (two-pass render); useSyncExternalStore with getServerSnapshot; suppressHydrationWarning only for unavoidable text differences.',
      'Suspense enables selective hydration: hydrate the parts the user interacts with first.',
    ],
    sources: [
      {
        label: 'react.dev — hydrateRoot: different client and server content',
        url: 'https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content',
      },
      { label: 'Next.js — Text content does not match server-rendered HTML', url: 'https://nextjs.org/docs/messages/react-hydration-error' },
    ],
  },
  {
    id: 'ra-rsc',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt:
      "Explain React Server Components. How do server and client components differ, what does 'use client' do, and what can be passed across the boundary?",
    keyPoints: [
      'Server Components run only on the server (at build or request time); their code is never sent to the browser.',
      'They can be async and read data sources directly; they cannot use state, effects or browser APIs.',
      "'use client' marks a module boundary: that module and everything it imports become part of the client bundle.",
      'Server components can render client components and pass serialisable props (no functions, except Server Functions).',
      'Client components cannot import server components, but can receive them as children/props.',
      'RSC is not the same as SSR: SSR produces HTML; RSC produces a serialised component tree. They are often used together.',
      "'use server' marks Server Functions, not Server Components.",
    ],
    sources: [
      { label: 'react.dev — Server Components', url: 'https://react.dev/reference/rsc/server-components' },
      { label: "react.dev — 'use client'", url: 'https://react.dev/reference/rsc/use-client' },
      {
        label: 'Next.js — Server and Client Components',
        url: 'https://nextjs.org/docs/app/getting-started/server-and-client-components',
      },
    ],
  },
  {
    id: 'ra-actions',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'Explain Actions in React 19: Server Functions, useActionState, useFormStatus and useOptimistic. What are the security implications?',
    keyPoints: [
      'An Action is an async function used in a transition; <form action={fn}> accepts functions and passes FormData.',
      "Server Functions ('use server') can be called from the client; under the hood they are POST endpoints.",
      'useActionState tracks the result and pending state of an action.',
      'useFormStatus reads the pending status of the parent <form> (useful for submit buttons).',
      'useOptimistic shows an optimistic value while the action runs and reverts automatically if it fails.',
      'Forms can work before JS loads (progressive enhancement).',
      'Security: Server Functions are public endpoints; validate input and check authorisation inside every one.',
    ],
    sources: [
      { label: 'React 19 release post', url: 'https://react.dev/blog/2024/12/05/react-19' },
      { label: 'react.dev — Server Functions', url: 'https://react.dev/reference/rsc/server-functions' },
      { label: 'react.dev — useActionState', url: 'https://react.dev/reference/react/useActionState' },
      { label: 'react.dev — useOptimistic', url: 'https://react.dev/reference/react/useOptimistic' },
    ],
  },
  {
    id: 'ra-react19',
    category: 'react-advanced',
    level: 'mid',
    type: 'concept',
    prompt: 'What are the most important changes in React 19 (and 19.x) for day-to-day code? What was removed?',
    keyPoints: [
      'Actions and the hooks around them (useActionState, useFormStatus, useOptimistic).',
      'The use() API for reading promises and context.',
      'ref is a regular prop for function components (forwardRef no longer needed); ref callbacks can return a cleanup.',
      '<Context> can be rendered directly as a provider.',
      'Native support for <title>/<meta>/<link> hoisting, stylesheet precedence and resource preloading APIs.',
      'Better hydration error messages.',
      'Removed: propTypes and defaultProps on function components, string refs, legacy context, ReactDOM.render/hydrate (use createRoot/hydrateRoot).',
      '19.2 added <Activity> and stable useEffectEvent.',
    ],
    sources: [
      { label: 'React 19 release post', url: 'https://react.dev/blog/2024/12/05/react-19' },
      { label: 'React 19 Upgrade Guide', url: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide' },
      { label: 'React 19.2 release post', url: 'https://react.dev/blog/2025/10/01/react-19-2' },
    ],
  },
  {
    id: 'ra-compiler',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'What does the React Compiler do, what are its requirements, and how does it change how you write memoisation?',
    keyPoints: [
      'A build-time compiler (Babel plugin) that automatically memoises components and hooks, at a finer granularity than manual useMemo/useCallback.',
      'It requires code that follows the Rules of React (purity, immutability, rules of hooks); it skips components that break them.',
      'Manual useMemo/useCallback/memo become mostly unnecessary for performance; keep them where identity matters semantically, e.g. effect dependencies.',
      'Adopt incrementally; use the ESLint plugin to find rule violations.',
      'Version 1.0 was released as stable in late 2025.',
    ],
    sources: [
      { label: 'react.dev — React Compiler', url: 'https://react.dev/learn/react-compiler' },
      { label: 'react.dev — Rules of React', url: 'https://react.dev/reference/rules' },
    ],
  },
  {
    id: 'ra-refs-imperative',
    category: 'react-advanced',
    level: 'mid',
    type: 'concept',
    prompt:
      'How do you expose a DOM node or imperative methods from your component to its parent? When is an imperative API appropriate?',
    keyPoints: [
      'React 19: function components accept ref as a normal prop. Before 19: wrap with forwardRef.',
      'useImperativeHandle exposes a limited API ({ focus, scrollIntoView }) instead of the whole DOM node.',
      'Appropriate for focus, text selection, scrolling, media playback, triggering animations, integrating non-React libraries.',
      'Prefer declarative props (isOpen) over imperative methods (open()) for anything that can be expressed as state.',
    ],
    sources: [
      { label: 'react.dev — useImperativeHandle', url: 'https://react.dev/reference/react/useImperativeHandle' },
      { label: 'react.dev — forwardRef', url: 'https://react.dev/reference/react/forwardRef' },
      { label: 'react.dev — Manipulating the DOM with Refs', url: 'https://react.dev/learn/manipulating-the-dom-with-refs' },
    ],
  },
  {
    id: 'ra-activity',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'What does <Activity> (React 19.2) do, and how is it different from conditional rendering or hiding with CSS?',
    keyPoints: [
      '<Activity mode="hidden"> hides a subtree while keeping its state and DOM.',
      'Hidden content has its effects cleaned up and its updates deprioritised.',
      'Conditional rendering unmounts and loses state; CSS hiding keeps effects (subscriptions, timers) running.',
      'Use cases: tabs that keep their state, pre-rendering a screen the user is likely to open next.',
    ],
    sources: [
      { label: 'react.dev — <Activity>', url: 'https://react.dev/reference/react/Activity' },
      { label: 'React 19.2 release post', url: 'https://react.dev/blog/2025/10/01/react-19-2' },
    ],
  },
  {
    id: 'ra-reset-with-effect',
    category: 'react-advanced',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'The draft should reset whenever the user changes. What is wrong with this approach and what is better?',
    codeLang: 'jsx',
    code: `function EditProfile({ userId }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setDraft(null);
  }, [userId]);

  // ...form that edits draft
}`,
    keyPoints: [
      'First the component renders with the stale draft of the previous user, then the effect resets it: an extra render and a flash of wrong data.',
      'Every nested component with state needs the same treatment, which doesn’t scale.',
      'Better: have the parent pass a key: <EditProfile key={userId} userId={userId} />. React resets the whole subtree.',
      'For resetting only part of the state: adjust it during render by comparing with a stored previous prop.',
    ],
    sources: [
      {
        label: 'react.dev — Resetting all state when a prop changes',
        url: 'https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes',
      },
    ],
  },
  {
    id: 'ra-reconcile-type',
    category: 'react-advanced',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'A user types into <Form />, then isLoggedIn toggles. What happens to what they typed, and why?',
    codeLang: 'jsx',
    code: `function App({ isLoggedIn }) {
  return isLoggedIn
    ? <div><Form /></div>
    : <section><Form /></section>;
}`,
    keyPoints: [
      'The text is lost: Form is unmounted and remounted.',
      'The parent element type changed (div vs section), so React discards the whole subtree.',
      'State is preserved only when the same type is at the same position all the way up the tree.',
      'Keep the wrapper type stable (or change only its props/className) to keep the state.',
    ],
    sources: [
      {
        label: 'react.dev — Different components at the same position reset state',
        url: 'https://react.dev/learn/preserving-and-resetting-state#different-components-at-the-same-position-reset-state',
      },
    ],
  },
  {
    id: 'ra-use-api',
    category: 'react-advanced',
    level: 'senior',
    type: 'concept',
    prompt: 'How is the `use` API different from other hooks? What is the common mistake when using it with promises?',
    keyPoints: [
      'use() reads a promise or a context.',
      'Unlike hooks, it can be called inside conditions and loops (but still only in components or hooks).',
      'With a promise it suspends to the nearest Suspense boundary; a rejection goes to the nearest error boundary.',
      'Mistake: creating the promise during render, e.g. use(fetch(...)). A new promise each render suspends forever. Create it in a Server Component, a loader or a cache and pass it down.',
      'Cannot be called inside try/catch; use an error boundary or promise.catch.',
    ],
    sources: [{ label: 'react.dev — use', url: 'https://react.dev/reference/react/use' }],
  },
];
