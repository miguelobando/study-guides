import type { Question } from '../types';

export const hooks: Question[] = [
  {
    id: 'hs-snapshot',
    category: 'hooks-state',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'After one click, what is `count` and what is logged? How do you make it increase by 3?',
    codeLang: 'jsx',
    code: `function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
    keyPoints: [
      'count becomes 1, and the log prints 0.',
      'State is a snapshot: count is a constant (0) for the whole render, so all three calls set 0 + 1.',
      'setState does not change the variable immediately; it queues a re-render, and updates are batched.',
      'Use the updater form setCount(c => c + 1) three times to get 3: each updater receives the pending value.',
    ],
    sources: [
      { label: 'react.dev — State as a Snapshot', url: 'https://react.dev/learn/state-as-a-snapshot' },
      { label: 'react.dev — Queueing a Series of State Updates', url: 'https://react.dev/learn/queueing-a-series-of-state-updates' },
    ],
  },
  {
    id: 'hs-batching',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'What is automatic batching in React 18+? How does it differ from React 17, and how do you opt out?',
    keyPoints: [
      'Multiple state updates in the same tick are grouped into a single re-render.',
      'React 17 only batched inside React event handlers; updates in promises, setTimeout or native listeners rendered one by one.',
      'With createRoot (React 18+) batching applies everywhere.',
      'flushSync(() => ...) forces a synchronous render when you must read the DOM right after an update (rarely needed).',
    ],
    sources: [
      {
        label: 'React 18 release — Automatic batching',
        url: 'https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching',
      },
      { label: 'reactwg/react-18 — Automatic batching discussion', url: 'https://github.com/reactwg/react-18/discussions/21' },
    ],
  },
  {
    id: 'hs-mutation',
    category: 'hooks-state',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'New todos do not appear on screen. Why, and how do you fix it?',
    codeLang: 'jsx',
    code: `const [todos, setTodos] = useState([]);

function addTodo(text) {
  todos.push({ id: crypto.randomUUID(), text });
  setTodos(todos);
}`,
    keyPoints: [
      'The array is mutated and the same reference is passed back to setTodos.',
      'React compares with Object.is; same reference → it bails out and does not re-render.',
      'Mutation also breaks memoisation, time-travel debugging and concurrent rendering assumptions.',
      'Fix: setTodos(prev => [...prev, newTodo]). For nested objects spread every level or use Immer.',
    ],
    sources: [
      { label: 'react.dev — Updating Arrays in State', url: 'https://react.dev/learn/updating-arrays-in-state' },
      { label: 'react.dev — Updating Objects in State', url: 'https://react.dev/learn/updating-objects-in-state' },
    ],
  },
  {
    id: 'hs-effect-purpose',
    category: 'hooks-state',
    level: 'junior',
    type: 'concept',
    prompt: 'What is useEffect for? Give examples of when you should NOT use an effect.',
    keyPoints: [
      'Effects synchronise a component with an external system: subscriptions, timers, browser APIs, network, non-React widgets.',
      'Not for transforming data for rendering: compute it during render (useMemo if expensive).',
      'Not for responding to user events: put that logic in the event handler.',
      'Not for resetting state when a prop changes: use a key.',
      'Avoid chains of effects that set state to trigger other effects, and effects that notify the parent of changes.',
      'Data fetching in effects works but needs cleanup; frameworks or query libraries are preferred.',
    ],
    sources: [
      { label: 'react.dev — You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect' },
      { label: 'react.dev — Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects' },
    ],
  },
  {
    id: 'hs-deps',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt:
      'Explain the effect dependency array: no array vs [] vs [a, b]. How does React compare dependencies, and what happens if you "lie" about them?',
    keyPoints: [
      'No array: runs after every commit. []: runs on mount, cleanup on unmount. [a, b]: re-runs when any dependency changes.',
      'Comparison is Object.is per item; objects and functions created during render are new every time.',
      'Omitting a value that the effect reads creates stale closures (the effect sees old props/state).',
      'Fix the code rather than the array: move objects/functions inside the effect, use updater functions, useReducer, or useEffectEvent for non-reactive logic.',
      'eslint-plugin-react-hooks (exhaustive-deps) should not be silenced.',
    ],
    followUps: ['How would you avoid re-subscribing to a chat room when only the theme changes?'],
    sources: [
      { label: 'react.dev — Lifecycle of Reactive Effects', url: 'https://react.dev/learn/lifecycle-of-reactive-effects' },
      { label: 'react.dev — Removing Effect Dependencies', url: 'https://react.dev/learn/removing-effect-dependencies' },
      { label: 'Dan Abramov — A Complete Guide to useEffect', url: 'https://overreacted.io/a-complete-guide-to-useeffect/' },
    ],
  },
  {
    id: 'hs-race-condition',
    category: 'hooks-state',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'When switching quickly between users, the profile sometimes shows the wrong person. Explain and fix. What else is missing?',
    codeLang: 'jsx',
    code: `function Profile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <Spinner />;
  return <h1>{user.name}</h1>;
}`,
    keyPoints: [
      'Race condition: responses can arrive out of order; an older request resolving last overwrites the newer user.',
      'No cleanup. Fix with a flag (let ignore = false; cleanup sets ignore = true) or an AbortController aborted in the cleanup.',
      'Missing error handling and a res.ok check (fetch does not reject on 404/500).',
      'Old user is shown while the new one loads; loading state should reset or be keyed.',
      'In production apps prefer a data library (TanStack Query, SWR) or framework loaders: caching, dedupe, cancellation.',
    ],
    sources: [
      { label: 'react.dev — Fetching data in Effects', url: 'https://react.dev/learn/synchronizing-with-effects#fetching-data' },
      { label: 'react.dev — You Might Not Need an Effect: Fetching data', url: 'https://react.dev/learn/you-might-not-need-an-effect#fetching-data' },
      { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
    ],
  },
  {
    id: 'hs-stale-interval',
    category: 'hooks-state',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'The timer shows 1 and then stops counting. Why? Give two fixes.',
    codeLang: 'jsx',
    code: `function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds(seconds + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{seconds}</p>;
}`,
    keyPoints: [
      'Stale closure: the interval callback captured seconds = 0 from the first render, so it always sets 1.',
      'Fix 1 (best): updater function setSeconds(s => s + 1); the effect no longer reads seconds.',
      'Fix 2: add seconds to the deps; it works but tears down and recreates the interval every tick.',
      'For callbacks that need the latest props: a ref holding the latest callback (Dan Abramov’s useInterval) or useEffectEvent.',
    ],
    sources: [
      { label: 'Dan Abramov — Making setInterval Declarative with React Hooks', url: 'https://overreacted.io/making-setinterval-declarative-with-react-hooks/' },
      {
        label: 'react.dev — Reading state to calculate the next state',
        url: 'https://react.dev/learn/removing-effect-dependencies#are-you-reading-some-state-to-calculate-the-next-state',
      },
    ],
  },
  {
    id: 'hs-derived-state',
    category: 'hooks-state',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'What is the problem with this component and how would you rewrite it?',
    codeLang: 'jsx',
    code: `function TodoList({ todos, filter }) {
  const [visibleTodos, setVisibleTodos] = useState([]);

  useEffect(() => {
    setVisibleTodos(
      todos.filter(t => filter === 'all' || t.status === filter)
    );
  }, [todos, filter]);

  return <List items={visibleTodos} />;
}`,
    keyPoints: [
      'visibleTodos is derived data stored as redundant state and synced with an effect.',
      'Each change renders once with stale data, then again after the effect: extra render and a flash of wrong UI.',
      'Compute during render: const visibleTodos = todos.filter(...).',
      'Wrap in useMemo only if measurably expensive.',
      'Principle: don’t sync state, derive it.',
    ],
    sources: [
      {
        label: 'react.dev — Updating state based on props or state',
        url: 'https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state',
      },
      { label: "Kent C. Dodds — Don't Sync State. Derive It!", url: 'https://kentcdodds.com/blog/dont-sync-state-derive-it' },
    ],
  },
  {
    id: 'hs-async-effect',
    category: 'hooks-state',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'What is wrong with this effect?',
    codeLang: 'jsx',
    code: `useEffect(async () => {
  const res = await fetch('/api/items');
  setItems(await res.json());
}, []);`,
    keyPoints: [
      'An async function always returns a Promise, but an effect must return a cleanup function or nothing. React warns.',
      'Because of that you cannot return a cleanup, so you cannot cancel or ignore the request.',
      'Fix: define an async function inside the effect and call it, plus an ignore flag/AbortController in the cleanup.',
      'Also add error handling and a res.ok check.',
    ],
    sources: [
      { label: 'react.dev — useEffect: Fetching data with Effects', url: 'https://react.dev/reference/react/useEffect#fetching-data-with-effects' },
    ],
  },
  {
    id: 'hs-useref',
    category: 'hooks-state',
    level: 'junior',
    type: 'concept',
    prompt: 'useRef vs useState: when would you use a ref? Why shouldn’t you read or write ref.current during render?',
    keyPoints: [
      'A ref is a mutable box ({ current }) that persists across renders; changing it does not trigger a re-render.',
      'Use refs for DOM nodes, timer/interval ids, previous values, imperative handles, and values not shown in the UI.',
      'Use state for anything that affects what is rendered.',
      'Reading/writing ref.current during render makes the component impure and unpredictable (except lazy initialisation).',
      'ref.current in an effect dependency array does not work: changing it doesn’t cause a render.',
    ],
    sources: [
      { label: 'react.dev — Referencing Values with Refs', url: 'https://react.dev/learn/referencing-values-with-refs' },
      { label: 'react.dev — Manipulating the DOM with Refs', url: 'https://react.dev/learn/manipulating-the-dom-with-refs' },
    ],
  },
  {
    id: 'hs-memo-callback',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt:
      'useMemo vs useCallback vs React.memo: what does each do, when do they actually help, and what do they cost?',
    keyPoints: [
      'useMemo caches a computed value between renders until its dependencies change.',
      'useCallback caches a function identity (equivalent to useMemo(() => fn, deps)).',
      'React.memo skips re-rendering a component when its props are shallowly equal.',
      'useCallback/useMemo for props only help when the child is memoised, or the value is an effect dependency.',
      'Costs: memory, dependency comparisons, code noise, and false confidence. Measure first.',
      'Often better: move state down, or lift content up via children. The React Compiler can memoise automatically.',
    ],
    sources: [
      { label: 'react.dev — useMemo', url: 'https://react.dev/reference/react/useMemo' },
      { label: 'react.dev — useCallback', url: 'https://react.dev/reference/react/useCallback' },
      { label: 'react.dev — memo', url: 'https://react.dev/reference/react/memo' },
      { label: 'Dan Abramov — Before You memo()', url: 'https://overreacted.io/before-you-memo/' },
    ],
  },
  {
    id: 'hs-usereducer',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'When would you choose useReducer over useState? What are the rules for a reducer?',
    keyPoints: [
      'Many related pieces of state, next state depending on previous, or many handlers updating the same state.',
      'Centralises update logic in a pure function that is easy to test in isolation.',
      'Actions describe what happened ("added_item") rather than how to set state.',
      'Reducers must be pure: no mutation, no side effects, no async.',
      'dispatch has a stable identity, so it can be passed down through context without breaking memoisation.',
    ],
    sources: [
      { label: 'react.dev — Extracting State Logic into a Reducer', url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer' },
      { label: 'react.dev — Scaling Up with Reducer and Context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
    ],
  },
  {
    id: 'hs-context',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'How does Context work, and what are its performance pitfalls? Is Context a state management solution?',
    keyPoints: [
      'A Provider makes a value available to any descendant; useContext reads the nearest provider (or the default value).',
      'Every consumer re-renders when the value changes (Object.is); passing a new object literal re-renders all consumers on every provider render.',
      'Mitigations: memoise the value, split contexts (state vs dispatch, or by domain), keep high-frequency state out of context.',
      'Context is a transport mechanism (dependency injection), not a store; there are no selectors.',
      'For frequent updates with fine-grained subscriptions, use an external store (Zustand, Redux) with selectors.',
    ],
    sources: [
      { label: 'react.dev — Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
      {
        label: 'react.dev — useContext: optimizing re-renders',
        url: 'https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions',
      },
      { label: 'Kent C. Dodds — How to use React Context effectively', url: 'https://kentcdodds.com/blog/how-to-use-react-context-effectively' },
    ],
  },
  {
    id: 'hs-custom-hooks',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'What makes a good custom hook? Do two components using the same custom hook share state?',
    keyPoints: [
      'Custom hooks extract reusable stateful logic; they must start with "use" and may call other hooks.',
      'They share logic, not state: each call gets its own independent state.',
      'Good hooks have a concrete purpose (useOnlineStatus, useChatRoom), not lifecycle wrappers like useMount.',
      'Return a small, stable API; keep inputs reactive and handle cleanup inside.',
      'To share state, lift it up or use context or a store.',
    ],
    sources: [{ label: 'react.dev — Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }],
  },
  {
    id: 'hs-rules-of-hooks',
    category: 'hooks-state',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'This throws an error after the user loads. Why?',
    codeLang: 'jsx',
    code: `function Profile({ user }) {
  if (!user) return <Spinner />;

  const [tab, setTab] = useState('posts');
  useEffect(() => {
    document.title = user.name;
  }, [user.name]);

  return <Tabs value={tab} onChange={setTab} />;
}`,
    keyPoints: [
      'The early return comes before the hooks, so the number and order of hook calls changes between renders.',
      'React identifies hooks by call order: "Rendered more hooks than during the previous render".',
      'Rules of Hooks: call hooks only at the top level of components or custom hooks, never in conditions, loops or after early returns.',
      'Fix: move all hooks above the early return (guard inside the effect).',
      'Exception: the new use() API can be called conditionally.',
    ],
    sources: [
      { label: 'react.dev — Rules of Hooks', url: 'https://react.dev/reference/rules/rules-of-hooks' },
      { label: 'Dan Abramov — Why Do React Hooks Rely on Call Order?', url: 'https://overreacted.io/why-do-hooks-rely-on-call-order/' },
    ],
  },
  {
    id: 'hs-layout-effect',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'useEffect vs useLayoutEffect vs useInsertionEffect: what is the difference and when do you use each?',
    keyPoints: [
      'useEffect runs after the browser paints (usually), so it doesn’t block rendering.',
      'useLayoutEffect runs synchronously after DOM mutations and before paint: for measuring layout (tooltip position) to avoid visual flicker.',
      'useLayoutEffect blocks paint, so overuse hurts performance; it does nothing during server rendering.',
      'useInsertionEffect fires before layout effects; it is meant for CSS-in-JS libraries to inject styles.',
    ],
    sources: [
      { label: 'react.dev — useLayoutEffect', url: 'https://react.dev/reference/react/useLayoutEffect' },
      { label: 'react.dev — useInsertionEffect', url: 'https://react.dev/reference/react/useInsertionEffect' },
    ],
  },
  {
    id: 'hs-usesyncexternalstore',
    category: 'hooks-state',
    level: 'senior',
    type: 'concept',
    prompt: 'What problem does useSyncExternalStore solve? What is "tearing"?',
    keyPoints: [
      'It subscribes components to external mutable sources (browser APIs like navigator.onLine, third-party stores) safely under concurrent rendering.',
      'Tearing: during an interruptible render, different components read different versions of the same external value and show inconsistent UI.',
      'API: subscribe(callback) returning unsubscribe, getSnapshot (must return a cached/immutable value or it loops), optional getServerSnapshot for SSR.',
      'Redux, Zustand and others use it internally.',
    ],
    sources: [
      { label: 'react.dev — useSyncExternalStore', url: 'https://react.dev/reference/react/useSyncExternalStore' },
      { label: 'reactwg/react-18 — What is tearing?', url: 'https://github.com/reactwg/react-18/discussions/69' },
    ],
  },
  {
    id: 'hs-useid',
    category: 'hooks-state',
    level: 'mid',
    type: 'concept',
    prompt: 'Why use useId instead of Math.random() or a module-level counter to generate element ids?',
    keyPoints: [
      'useId produces ids that are stable between server and client render, which avoids hydration mismatches.',
      'Each component instance gets a unique id, so reusable components can render many times on a page.',
      'Used for accessibility attributes: htmlFor/id, aria-describedby, aria-labelledby.',
      'Not for list keys; keys should come from your data.',
    ],
    sources: [{ label: 'react.dev — useId', url: 'https://react.dev/reference/react/useId' }],
  },
  {
    id: 'hs-object-dep-loop',
    category: 'hooks-state',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'This component hammers the API with requests. Why?',
    codeLang: 'jsx',
    code: `function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const options = { query, limit: 20 };

  useEffect(() => {
    api.search(options).then(setResults);
  }, [options]);

  return <ResultList items={results} />;
}`,
    keyPoints: [
      'options is a new object every render, so the dependency always "changes".',
      'Effect runs → setResults → re-render → new options → effect runs again: an infinite fetch loop.',
      'Fix: create the object inside the effect and depend on the primitive [query], or useMemo.',
      'Also missing: cleanup for races and error handling.',
    ],
    sources: [
      {
        label: 'react.dev — Does some reactive value change unintentionally?',
        url: 'https://react.dev/learn/removing-effect-dependencies#does-some-reactive-value-change-unintentionally',
      },
    ],
  },
  {
    id: 'hs-effect-for-event',
    category: 'hooks-state',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'QA reports duplicated registrations. What is the design problem here?',
    codeLang: 'jsx',
    code: `function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (submitted) {
      post('/api/register', data);
      showToast('Registered!');
    }
  }, [submitted, data]);

  return (
    <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
      {/* fields calling setData */}
    </form>
  );
}`,
    keyPoints: [
      'Logic caused by a user action belongs in the event handler, not in an effect.',
      'After submitting, any change to data re-runs the effect and posts again (duplicates).',
      'The submitted flag is state that only exists to trigger an effect.',
      'Fix: call post() and showToast() directly in onSubmit.',
      'Heuristic: "runs because the component was displayed" → effect; "runs because the user did X" → handler.',
    ],
    sources: [
      {
        label: 'react.dev — Sending a POST request',
        url: 'https://react.dev/learn/you-might-not-need-an-effect#sending-a-post-request',
      },
    ],
  },
  {
    id: 'hs-useeffectevent',
    category: 'hooks-state',
    level: 'senior',
    type: 'concept',
    prompt: 'What is useEffectEvent and which problem does it solve? When should you not use it?',
    keyPoints: [
      'It separates non-reactive logic from an effect: the function always sees the latest props/state but is not a dependency.',
      'Example: connect to a room when roomId changes, but read the current theme for a notification without reconnecting on theme change.',
      'Stable since React 19.2.',
      'Only call Effect Events from inside effects; don’t pass them to other components.',
      'It is not a way to silence the exhaustive-deps lint for values that really should re-run the effect.',
    ],
    sources: [
      { label: 'react.dev — Separating Events from Effects', url: 'https://react.dev/learn/separating-events-from-effects' },
      { label: 'react.dev — useEffectEvent', url: 'https://react.dev/reference/react/useEffectEvent' },
    ],
  },
  {
    id: 'hs-lazy-init',
    category: 'hooks-state',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'What is the difference between these two lines, and which one should you use?',
    codeLang: 'jsx',
    code: `const [todos, setTodos] = useState(createInitialTodos());
const [todos, setTodos] = useState(createInitialTodos);`,
    keyPoints: [
      'The first calls createInitialTodos on every render and throws the result away after the first.',
      'The second passes the function as an initialiser, which React calls only on the first render.',
      'Use the lazy form for expensive initialisation (parsing localStorage, building large structures).',
      'In StrictMode the initialiser is called twice in development, so it must be pure.',
    ],
    sources: [
      {
        label: 'react.dev — Avoiding recreating the initial state',
        url: 'https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state',
      },
    ],
  },
];
