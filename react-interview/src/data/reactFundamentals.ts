import type { Question } from '../types';

export const reactFundamentals: Question[] = [
  {
    id: 'rf-jsx',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'What is JSX and what does it compile to? Why does a component have to return a single root element?',
    keyPoints: [
      'JSX is a syntax extension; it is not HTML. A compiler (Babel/SWC/esbuild) turns it into function calls.',
      'With the automatic runtime (React 17+) it compiles to jsx()/jsxs() from react/jsx-runtime; before that it was React.createElement().',
      'The result is a React element: a plain, immutable object describing type, props and children.',
      'A function can only return one value, so siblings must be wrapped in a parent or a Fragment (<>...</>).',
      'Differences from HTML: className, htmlFor, camelCase attributes and events, {} for JS expressions, all tags must be closed.',
      'Values interpolated with {} are escaped by default, which protects against most XSS.',
    ],
    followUps: ['When do you need <Fragment key={...}> instead of <>...</>?'],
    sources: [
      { label: 'react.dev — Writing Markup with JSX', url: 'https://react.dev/learn/writing-markup-with-jsx' },
      {
        label: 'React blog — Introducing the New JSX Transform',
        url: 'https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html',
      },
    ],
  },
  {
    id: 'rf-props-state',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt: 'What is the difference between props and state? Who owns each one, and what causes a component to re-render?',
    keyPoints: [
      'Props are inputs passed by the parent; they are read-only for the receiving component.',
      'State is memory owned by the component instance, changed only through its setter (or dispatch).',
      'A re-render is triggered by: the component’s own state change, its parent re-rendering, or a context it reads changing.',
      'Never mutate props or state directly; create new values.',
      'State is isolated per component instance and tied to its position in the tree.',
    ],
    sources: [
      { label: 'react.dev — Passing Props to a Component', url: 'https://react.dev/learn/passing-props-to-a-component' },
      { label: "react.dev — State: A Component's Memory", url: 'https://react.dev/learn/state-a-components-memory' },
    ],
  },
  {
    id: 'rf-keys',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt: 'Why does React need a `key` on list items? What can go wrong if you use the array index as the key?',
    keyPoints: [
      'Keys let React match items between renders during reconciliation, so it can move, insert and delete correctly.',
      'Use a stable, unique id from the data (database id, uuid generated when the item is created).',
      'Index keys break when the list is reordered, filtered or items are inserted at the start: state and uncontrolled DOM (inputs, focus) end up attached to the wrong item.',
      'Index is acceptable only for static lists that never change order.',
      'Keys must be unique among siblings, not globally; they are not passed down as a prop.',
      'Changing a key forces a remount, which is a deliberate way to reset state.',
    ],
    followUps: ['Why is key={Math.random()} even worse than the index?'],
    sources: [
      {
        label: 'react.dev — Rendering Lists (keys)',
        url: 'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key',
      },
      { label: 'react.dev — Preserving and Resetting State', url: 'https://react.dev/learn/preserving-and-resetting-state' },
    ],
  },
  {
    id: 'rf-controlled',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt: 'Explain controlled vs uncontrolled inputs. When would you choose each one?',
    keyPoints: [
      'Controlled: value comes from React state and changes go through onChange. React is the single source of truth.',
      'Controlled inputs make per-keystroke validation, formatting, conditional UI and resetting easy.',
      'Uncontrolled: the DOM keeps the value; you set defaultValue and read it via a ref or FormData on submit.',
      'Uncontrolled is simpler and avoids a re-render per keystroke in large forms (React Hook Form relies on this).',
      'Switching from controlled to uncontrolled (value becoming undefined) triggers a warning; initialise with "" instead.',
      'React 19 form actions receive FormData, which makes uncontrolled forms more common again.',
    ],
    sources: [
      {
        label: 'react.dev — Controlled and uncontrolled components',
        url: 'https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components',
      },
      { label: 'react.dev — <input> reference', url: 'https://react.dev/reference/react-dom/components/input' },
    ],
  },
  {
    id: 'rf-lifting-state',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt: 'Two sibling components need to read and update the same data. How do you share it?',
    keyPoints: [
      'Lift the state up to their closest common parent and pass the value and an update callback down as props.',
      'That keeps a single source of truth instead of duplicating and syncing state.',
      'If it has to pass through many layers, consider composition (passing JSX as children) before reaching for context.',
      'Keep state as close as possible to where it is used (colocation); lift only as far as needed.',
    ],
    sources: [
      { label: 'react.dev — Sharing State Between Components', url: 'https://react.dev/learn/sharing-state-between-components' },
    ],
  },
  {
    id: 'rf-virtual-dom',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt:
      'Explain the "virtual DOM" and reconciliation. Is it accurate to say the virtual DOM is "faster than the real DOM"?',
    keyPoints: [
      'Rendering produces a tree of React elements (plain objects); React compares it with the previous tree.',
      'The diff uses heuristics to stay O(n): a different element type at the same position tears down the subtree; the same type updates props; keys identify list items.',
      'The commit phase then applies the minimal set of DOM mutations.',
      'It is not inherently faster than hand-written, targeted DOM updates; its value is a declarative programming model with good-enough performance by default.',
      'Re-rendering a component does not necessarily mean the DOM changes.',
    ],
    sources: [
      { label: 'Legacy React docs — Reconciliation', url: 'https://legacy.reactjs.org/docs/reconciliation.html' },
      { label: 'react.dev — Render and Commit', url: 'https://react.dev/learn/render-and-commit' },
    ],
  },
  {
    id: 'rf-render-commit',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt: 'What happens in the render phase vs the commit phase? What does "rendering" actually mean in React?',
    keyPoints: [
      'Trigger → render → commit. Rendering means React calls your component functions to compute the next UI.',
      'The render phase must be pure; with concurrent rendering it can be paused, restarted or thrown away.',
      'The commit phase applies DOM changes, attaches refs and runs layout effects synchronously.',
      'Passive effects (useEffect) run after the browser has painted, in most cases.',
      'A render that produces the same output results in no DOM changes.',
    ],
    sources: [{ label: 'react.dev — Render and Commit', url: 'https://react.dev/learn/render-and-commit' }],
  },
  {
    id: 'rf-pure',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt: 'What does it mean that React components must be pure? Give concrete examples of impure render code.',
    keyPoints: [
      'Same props, state and context in, same JSX out, with no observable side effects during render.',
      'Impure examples: mutating a variable or object created outside the component, mutating props/state, fetching or subscribing in the render body, touching the DOM, using Math.random()/Date.now() for output (hydration mismatches).',
      'Mutating objects you just created inside the render is fine (local mutation).',
      'Side effects belong in event handlers first, effects as a last resort.',
      'StrictMode double-invokes render in development to surface impurity; the React Compiler relies on purity.',
    ],
    sources: [
      { label: 'react.dev — Keeping Components Pure', url: 'https://react.dev/learn/keeping-components-pure' },
      { label: 'react.dev — Rules of React', url: 'https://react.dev/reference/rules' },
    ],
  },
  {
    id: 'rf-composition',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt: 'Composition vs inheritance in React: what is `children`, and how can composition reduce prop drilling?',
    keyPoints: [
      'React favours composition; class inheritance between components is discouraged.',
      'children (and other "slot" props such as header/footer that accept JSX) let a parent decide what goes inside a generic container.',
      'Passing already-rendered JSX down means intermediate components no longer need to forward props they do not use.',
      'Specialisation is done by wrapping a generic component and configuring it with props.',
    ],
    sources: [
      {
        label: 'react.dev — Passing JSX as children',
        url: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children',
      },
      {
        label: 'react.dev — Before you use context',
        url: 'https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context',
      },
    ],
  },
  {
    id: 'rf-conditional-zero',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this render when `messages` is an empty array? How would you fix it?',
    codeLang: 'jsx',
    code: `function Inbox({ messages }) {
  return (
    <div>
      {messages.length && <p>You have {messages.length} new messages</p>}
    </div>
  );
}

<Inbox messages={[]} />`,
    keyPoints: [
      'It renders the text "0": && returns its left operand when it is falsy, and React renders numbers.',
      'Fix with an explicit boolean: messages.length > 0 && ..., or a ternary returning null.',
      'false, null and undefined render nothing; 0 and NaN do render.',
      'In React Native this can crash because text must be inside <Text>.',
    ],
    sources: [
      {
        label: 'react.dev — Conditional Rendering (&& pitfall)',
        url: 'https://react.dev/learn/conditional-rendering#logical-and-operator-',
      },
    ],
  },
  {
    id: 'rf-event-handler-call',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'This component crashes. Why?',
    codeLang: 'jsx',
    code: `function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={setCount(count + 1)}>{count}</button>;
}`,
    keyPoints: [
      'setCount(count + 1) is called during render instead of being passed as a handler.',
      'Setting state during render schedules another render, which sets state again: "Too many re-renders" infinite loop.',
      'Pass a function: onClick={() => setCount(c => c + 1)}.',
      'Rule: pass the function, don’t call it.',
    ],
    sources: [
      { label: 'react.dev — Responding to Events (pitfall)', url: 'https://react.dev/learn/responding-to-events' },
    ],
  },
  {
    id: 'rf-nested-component',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Users report that the search input loses focus after every keystroke. What is the cause and the fix?',
    codeLang: 'jsx',
    code: `function ProductList({ products }) {
  const [query, setQuery] = useState('');

  function SearchInput() {
    return <input value={query} onChange={e => setQuery(e.target.value)} />;
  }

  return (
    <>
      <SearchInput />
      {products
        .filter(p => p.name.includes(query))
        .map(p => <Row key={p.id} product={p} />)}
    </>
  );
}`,
    keyPoints: [
      'SearchInput is defined inside ProductList, so each render creates a new component type.',
      'React sees a different type at the same position, unmounts the old input and mounts a new one: focus and any state are lost.',
      'It also wastes work recreating DOM on every keystroke.',
      'Fix: declare components at module top level and pass data through props, or inline the JSX.',
    ],
    sources: [
      {
        label: 'react.dev — Nesting and organizing components (pitfall)',
        url: 'https://react.dev/learn/your-first-component#nesting-and-organizing-components',
      },
      {
        label: 'react.dev — Different components at the same position reset state',
        url: 'https://react.dev/learn/preserving-and-resetting-state#different-components-at-the-same-position-reset-state',
      },
    ],
  },
  {
    id: 'rf-state-position',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt: 'When does React preserve a component’s state and when does it reset it? How do you force a reset on purpose?',
    keyPoints: [
      'State is tied to the component’s position in the UI tree, not to the JSX variable.',
      'Same component type at the same position → state is preserved across renders.',
      'A different type at that position (or a different parent type) → the whole subtree is unmounted and state is lost.',
      'Giving an element a different key forces a remount: <Chat key={contactId} />.',
      'Gotcha: {isA ? <Counter /> : <Counter />} keeps the same state because it is the same type at the same position.',
    ],
    sources: [
      { label: 'react.dev — Preserving and Resetting State', url: 'https://react.dev/learn/preserving-and-resetting-state' },
    ],
  },
  {
    id: 'rf-strictmode',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt: 'What does <StrictMode> do? Why do my effects run twice in development, and how should I deal with it?',
    keyPoints: [
      'Development-only checks; nothing changes in production.',
      'Double-invokes component bodies, state initialisers, updaters and reducers to expose impure code.',
      'Runs an extra setup → cleanup → setup cycle on mount to expose effects with missing or asymmetric cleanup.',
      'Also warns about deprecated APIs; in React 19 it double-invokes ref callbacks too.',
      'The fix is correct cleanup (unsubscribe, abort fetch, clear timer), not a ref guard that hides the second call.',
    ],
    sources: [
      { label: 'react.dev — <StrictMode>', url: 'https://react.dev/reference/react/StrictMode' },
      {
        label: 'react.dev — How to handle the Effect firing twice',
        url: 'https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development',
      },
    ],
  },
  {
    id: 'rf-props-to-state',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'When the parent passes a different `user`, the heading doesn’t update. Why? What are the right fixes?',
    codeLang: 'jsx',
    code: `function UserCard({ user }) {
  const [name, setName] = useState(user.name);
  return <h2>{name}</h2>;
}`,
    keyPoints: [
      'The useState argument is only the initial value; later prop changes are ignored.',
      'If the value is not edited locally, don’t copy it into state; read the prop directly.',
      'If it is an editable draft, reset it with a key on the parent (<UserCard key={user.id} ... />) or rename the prop initialName to make intent explicit.',
      'Avoid a useEffect that calls setName when the prop changes: it causes an extra render with stale data.',
    ],
    sources: [
      {
        label: "react.dev — Don't mirror props in state",
        url: 'https://react.dev/learn/choosing-the-state-structure#don-t-mirror-props-in-state',
      },
      {
        label: 'react.dev — Resetting all state when a prop changes',
        url: 'https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes',
      },
    ],
  },
  {
    id: 'rf-thinking-in-react',
    category: 'react-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'You get a mockup of a searchable, filterable product table. Walk me through how you would break it into components and decide where state lives.',
    keyPoints: [
      'Break the UI into a component hierarchy (single responsibility; follows the data model).',
      'Build a static version first with props only.',
      'Find the minimal but complete state (search text, "in stock only" checkbox); everything else (filtered list) is derived during render.',
      'Put each piece of state in the closest common owner of the components that use it.',
      'Add inverse data flow: pass callbacks down so children can update the parent state.',
    ],
    sources: [{ label: 'react.dev — Thinking in React', url: 'https://react.dev/learn/thinking-in-react' }],
  },
  {
    id: 'rf-synthetic-events',
    category: 'react-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt: 'How does React’s event system work? What changed in React 17, and how do events behave with portals?',
    keyPoints: [
      'React wraps native events in a cross-browser SyntheticEvent with the same interface.',
      'It uses delegation: listeners are attached once at the root container (since React 17; previously on document).',
      'React 17 also removed event pooling, and onScroll no longer bubbles.',
      'stopPropagation stops propagation through the React tree; capture handlers use the *Capture suffix (onClickCapture).',
      'Events inside a portal bubble to React ancestors, even though the DOM node lives elsewhere.',
    ],
    sources: [
      {
        label: 'React 17 RC — Changes to event delegation',
        url: 'https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation',
      },
      {
        label: 'react.dev — React event object',
        url: 'https://react.dev/reference/react-dom/components/common#react-event-object',
      },
    ],
  },
];
