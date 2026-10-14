import type { Question } from '../types';

export const performance: Question[] = [
  {
    id: 'pf-rerender-causes',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'What causes a React component to re-render? What is the common misconception about props?',
    keyPoints: [
      'Its own state changes (including state inside custom hooks it uses), a context it consumes changes, or its parent re-renders.',
      'Misconception: "it re-renders because props changed". A child re-renders when its parent does, whether or not props changed, unless wrapped in memo.',
      'memo opts into a shallow props comparison.',
      'A re-render is not a DOM update; it is usually cheap. Optimise slow renders, not every render.',
    ],
    sources: [
      { label: 'Josh W. Comeau — Why React Re-Renders', url: 'https://www.joshwcomeau.com/react/why-react-re-renders/' },
      { label: 'react.dev — Render and Commit', url: 'https://react.dev/learn/render-and-commit' },
    ],
  },
  {
    id: 'pf-diagnose',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt: 'A page feels sluggish when typing into a filter box. Walk me through how you would diagnose and fix it.',
    keyPoints: [
      'Reproduce with a production build and CPU throttling.',
      'React DevTools Profiler: which components render, how often, why, and how long they take.',
      'Chrome Performance panel: long tasks, scripting vs layout cost; check INP.',
      'Classify: one expensive render vs many unnecessary renders.',
      'Fixes: move state down / lift content up, memoise expensive subtrees, useDeferredValue or transitions, virtualise long lists, memoise expensive calculations, move heavy work to a web worker.',
      'Measure again after each change.',
    ],
    sources: [
      { label: 'react.dev — <Profiler>', url: 'https://react.dev/reference/react/Profiler' },
      { label: 'Chrome DevTools — Performance panel', url: 'https://developer.chrome.com/docs/devtools/performance' },
      { label: 'Kent C. Dodds — Fix the slow render before you fix the re-render', url: 'https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render' },
    ],
  },
  {
    id: 'pf-web-vitals',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'What are the Core Web Vitals, their "good" thresholds, and how do typical React apps hurt each one?',
    keyPoints: [
      'LCP (Largest Contentful Paint) ≤ 2.5 s: hurt by client-only rendering (blank HTML until JS runs), large bundles, unoptimised hero images, render-blocking resources.',
      'INP (Interaction to Next Paint) ≤ 200 ms: replaced FID in March 2024; hurt by long tasks during interactions, expensive re-renders, heavy hydration.',
      'CLS (Cumulative Layout Shift) ≤ 0.1: hurt by images without dimensions, content injected above existing content, late-loading fonts and ads.',
      'Measured at the 75th percentile of real users.',
      'Field data (CrUX, web-vitals library) vs lab data (Lighthouse).',
    ],
    sources: [
      { label: 'web.dev — Web Vitals', url: 'https://web.dev/articles/vitals' },
      { label: 'web.dev — Interaction to Next Paint (INP)', url: 'https://web.dev/articles/inp' },
      { label: 'web.dev — Largest Contentful Paint (LCP)', url: 'https://web.dev/articles/lcp' },
      { label: 'web.dev — Cumulative Layout Shift (CLS)', url: 'https://web.dev/articles/cls' },
    ],
  },
  {
    id: 'pf-code-splitting',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'How and where do you code-split a React app? What can go wrong?',
    keyPoints: [
      'Dynamic import() with React.lazy and a Suspense boundary.',
      'Split by route first, then heavy, rarely used components (charts, rich-text editors, modals).',
      'Prefetch likely next chunks on hover/idle.',
      'Too granular splitting adds requests and waterfalls.',
      'Chunk load failures after a deploy: wrap in an error boundary and retry/reload.',
      'Analyse bundles (rollup-plugin-visualizer, webpack-bundle-analyzer); replace heavy libraries.',
    ],
    sources: [
      { label: 'react.dev — lazy', url: 'https://react.dev/reference/react/lazy' },
      { label: 'webpack — Code Splitting', url: 'https://webpack.js.org/guides/code-splitting/' },
    ],
  },
  {
    id: 'pf-virtualization',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'Rendering a list of 10,000 rows is slow. What are your options and their trade-offs?',
    keyPoints: [
      'Virtualisation/windowing: only render rows in view plus overscan (TanStack Virtual, react-window).',
      'Alternatives: pagination, infinite loading, CSS content-visibility: auto.',
      'Trade-offs: dynamic row heights need measuring; browser find-in-page doesn’t see off-screen rows; accessibility needs aria-rowcount/aria-rowindex; scroll restoration.',
      'Also memoise row components and use stable keys.',
    ],
    sources: [
      { label: 'web.dev — Virtualize large lists with react-window', url: 'https://web.dev/articles/virtualize-long-lists-react-window' },
      { label: 'TanStack Virtual', url: 'https://tanstack.com/virtual/latest' },
    ],
  },
  {
    id: 'pf-context-value',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Toggling the theme re-renders every component that reads the user. Why, and how would you fix it?',
    codeLang: 'jsx',
    code: `const AppContext = createContext(null);

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}`,
    keyPoints: [
      'The value is a new object on every render, and it bundles unrelated data.',
      'Any change (theme) gives a new value → every consumer re-renders, including those that only use user.',
      'Split into separate contexts (UserContext, ThemeContext), and/or separate state from setters.',
      'Memoise the value with useMemo.',
      'children passed as a prop are not re-rendered by the provider itself; only consumers are.',
      'For frequently changing shared state, a store with selectors avoids this.',
    ],
    sources: [
      {
        label: 'react.dev — useContext: optimizing re-renders',
        url: 'https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions',
      },
      { label: 'Kent C. Dodds — How to use React Context effectively', url: 'https://kentcdodds.com/blog/how-to-use-react-context-effectively' },
    ],
  },
  {
    id: 'pf-memo-broken',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Chart is wrapped in React.memo but still re-renders on every keystroke. Why? Give at least two different fixes.',
    codeLang: 'jsx',
    code: `const Chart = React.memo(function Chart({ data, options, onPointClick }) {
  /* expensive rendering */
});

function Dashboard({ rows }) {
  const [filter, setFilter] = useState('');

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <Chart
        data={rows.map(toPoint)}
        options={{ animate: true }}
        onPointClick={p => console.log(p)}
      />
    </>
  );
}`,
    keyPoints: [
      'data (new array), options (new object) and onPointClick (new function) are recreated on every render, so the shallow comparison always fails.',
      'Fix A: useMemo for data with [rows], hoist the constant options outside the component, useCallback for the handler.',
      'Fix B (often better): move the filter input and its state into its own component so Dashboard doesn’t re-render on typing.',
      'Fix C: let the React Compiler memoise automatically.',
    ],
    sources: [
      { label: 'react.dev — memo: minimizing props changes', url: 'https://react.dev/reference/react/memo#minimizing-props-changes' },
      { label: 'Dan Abramov — Before You memo()', url: 'https://overreacted.io/before-you-memo/' },
    ],
  },
  {
    id: 'pf-images',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you optimise images in a React application?',
    keyPoints: [
      'Modern formats (AVIF/WebP) with fallbacks; compress; serve from a CDN with resizing.',
      'Responsive images: srcset and sizes so devices download the right size.',
      'Always reserve space (width/height or aspect-ratio) to avoid CLS.',
      'loading="lazy" for below-the-fold images, but never for the LCP image.',
      'fetchpriority="high" (and preload when needed) for the LCP image.',
      'Framework components (next/image) automate much of this.',
    ],
    sources: [
      { label: 'web.dev — Learn Images', url: 'https://web.dev/learn/images' },
      { label: 'web.dev — Fetch Priority', url: 'https://web.dev/articles/fetch-priority' },
    ],
  },
  {
    id: 'pf-long-tasks',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt: 'A heavy computation (parsing a large CSV, filtering 200k records) freezes the UI. What are your options?',
    keyPoints: [
      'Move it to a Web Worker (optionally with Comlink); transfer data with Transferables.',
      'Break the work into chunks and yield to the main thread (scheduler.yield where supported, or setTimeout).',
      'If rendering is the slow part: useDeferredValue/transitions, virtualisation.',
      'Do it on the server or stream-parse instead of loading everything at once.',
      'Goal: avoid main-thread tasks longer than 50 ms.',
    ],
    sources: [
      { label: 'MDN — Web Workers API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API' },
      { label: 'web.dev — Optimize long tasks', url: 'https://web.dev/articles/optimize-long-tasks' },
    ],
  },
  {
    id: 'pf-bundle-size',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you find out what makes your JavaScript bundle large, and how do you reduce it?',
    keyPoints: [
      'Analyse with a bundle visualiser; check packages with bundlephobia before adding them.',
      'Ensure tree-shaking (ESM builds, sideEffects flag); import only what you use.',
      'Replace heavy dependencies (moment → date-fns or Intl, lodash → lodash-es or native).',
      'Code-split routes and heavy components.',
      'Target modern browsers (browserslist) to drop unnecessary polyfills/transpilation.',
      'Brotli/gzip compression; deduplicate dependency versions; Server Components for non-interactive UI.',
    ],
    sources: [
      { label: 'webpack — Tree Shaking', url: 'https://webpack.js.org/guides/tree-shaking/' },
      { label: 'Bundlephobia', url: 'https://bundlephobia.com/' },
    ],
  },
  {
    id: 'pf-listener-leak',
    category: 'performance',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'What is wrong with this component? What happens over time?',
    codeLang: 'jsx',
    code: `function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener('resize', () => setWidth(window.innerWidth));
  }, []);

  return <span>{width}px</span>;
}`,
    keyPoints: [
      'The listener is never removed: every mount adds another one (memory leak; StrictMode doubles it in dev).',
      'After unmount the listener still calls setWidth.',
      'Fix: keep a reference to the handler and return () => window.removeEventListener("resize", handler).',
      'Improvements: throttle resize, or useSyncExternalStore; window is undefined during SSR.',
    ],
    sources: [
      {
        label: 'react.dev — Subscribing to events',
        url: 'https://react.dev/learn/synchronizing-with-effects#subscribing-to-events',
      },
      {
        label: 'react.dev — useSyncExternalStore: subscribing to a browser API',
        url: 'https://react.dev/reference/react/useSyncExternalStore#subscribing-to-a-browser-api',
      },
    ],
  },
  {
    id: 'pf-premature-memo',
    category: 'performance',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'A teammate memoises everything "for performance". Is this code an improvement?',
    codeLang: 'jsx',
    code: `function Greeting({ first, last }) {
  const [open, setOpen] = useState(false);
  const fullName = useMemo(() => \`\${first} \${last}\`, [first, last]);
  const handleClick = useCallback(() => setOpen(true), []);

  return <button onClick={handleClick}>{fullName}</button>;
}`,
    keyPoints: [
      'No: string concatenation is trivial, and useMemo’s bookkeeping costs about as much as the work itself.',
      'useCallback passed to a native <button> is pointless; the DOM element doesn’t compare props.',
      'Adds noise and dependency arrays that can go stale.',
      'Memoise when a computation is measurably expensive (around 1 ms or more) or when referential stability matters (memoised children, effect dependencies).',
    ],
    sources: [
      {
        label: 'react.dev — Should you add useMemo everywhere?',
        url: 'https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere',
      },
      { label: 'Kent C. Dodds — When to useMemo and useCallback', url: 'https://kentcdodds.com/blog/usememo-and-usecallback' },
    ],
  },
];
