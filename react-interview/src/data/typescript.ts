import type { Question } from '../types';

export const typescript: Question[] = [
  {
    id: 'tsq-type-vs-interface',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'type alias vs interface: what are the differences, and how do you choose?',
    keyPoints: [
      'Both can describe object shapes, and classes can implement either.',
      'Interfaces support declaration merging (declaring the same interface twice merges them) and extends.',
      'Type aliases can name anything: unions, intersections, primitives, tuples, mapped and conditional types.',
      'The handbook suggests interfaces until you need type-only features; the most important thing is consistency within a codebase.',
      'Interface extends tends to give clearer errors and is cached by the compiler; deep intersections can be slower.',
    ],
    sources: [
      {
        label: 'TS Handbook — Differences Between Type Aliases and Interfaces',
        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces',
      },
      { label: 'TS Handbook — Declaration Merging', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html' },
    ],
  },
  {
    id: 'tsq-any-unknown-never',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'Explain any, unknown and never. When do you use each?',
    keyPoints: [
      'any turns off type checking and spreads silently through the code; avoid it (noImplicitAny, lint rules).',
      'unknown is the safe top type: anything can be assigned to it, but you must narrow it before using it. Use it for external data, JSON.parse results and catch variables.',
      'never is the bottom type with no values: unreachable branches, exhaustiveness checks, functions that always throw.',
      'void means "the return value is ignored"; it isn’t the same as undefined.',
    ],
    sources: [
      { label: 'TS Handbook — unknown', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown' },
      { label: 'TS Handbook — The never type', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type' },
    ],
  },
  {
    id: 'tsq-narrowing',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'How does narrowing work in TypeScript? List the techniques you use.',
    keyPoints: [
      'Control-flow analysis narrows a union type inside branches.',
      'typeof, instanceof, the in operator, equality checks, truthiness checks.',
      'Discriminated unions (switch on a literal "kind"/"status" field).',
      'User-defined type guards (x is T) and assertion functions (asserts x is T).',
      'TS 5.5+ infers type predicates from simple arrow functions, e.g. filter(x => x !== undefined).',
    ],
    sources: [{ label: 'TS Handbook — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' }],
  },
  {
    id: 'tsq-discriminated',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Why does TypeScript complain on the marked line, and how would you model this state better?',
    codeLang: 'ts',
    code: `type RequestState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: User;
  error?: string;
};

function title(s: RequestState) {
  if (s.status === 'success') {
    return s.data.name; // ← error: 's.data' is possibly 'undefined'
  }
  return '';
}`,
    keyPoints: [
      'Optional fields allow impossible states: success without data, error with data, etc.; checking status doesn’t narrow data.',
      'Use a discriminated union: | { status: "idle" } | { status: "loading" } | { status: "success"; data: User } | { status: "error"; error: string }.',
      'Checking status now narrows to the right member, so s.data is a User.',
      'Pair with an exhaustive switch (never) so new states can’t be forgotten.',
      '"Make impossible states impossible."',
    ],
    sources: [
      { label: 'TS Handbook — Discriminated unions', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions' },
    ],
  },
  {
    id: 'tsq-exhaustive',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'A teammate added "triangle" to Shape. What happens here, and how do you make the compiler catch every missing case in general?',
    codeLang: 'ts',
    code: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; size: number }
  | { kind: 'triangle'; base: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.r ** 2;
    case 'square':
      return s.size ** 2;
  }
}`,
    keyPoints: [
      'With the explicit number return type and strict mode, TS reports that the function lacks an ending return statement. That only works by accident; a function returning void or a switch used for side effects would fail silently.',
      'Add a default branch: const _exhaustive: never = s; (or assertNever(s)). Any unhandled member then becomes a compile error.',
      'Alternative: s satisfies never in the default branch, or the switch-exhaustiveness-check lint rule.',
    ],
    sources: [
      { label: 'TS Handbook — Exhaustiveness checking', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking' },
    ],
  },
  {
    id: 'tsq-generics',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt: 'Write a fully typed `getProperty(obj, key)` so that the return type matches the property, and wrong keys are rejected. Explain the constraint you used.',
    codeLang: 'ts',
    code: `const user = { id: 1, name: 'Ada', admin: true };

const n = getProperty(user, 'name');   // should be string
const a = getProperty(user, 'admin');  // should be boolean
getProperty(user, 'email');            // should be a compile error`,
    keyPoints: [
      'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }',
      'K extends keyof T restricts keys to those that exist on T; T[K] is an indexed access type.',
      'Type arguments are inferred from the call; no need to write them explicitly.',
      'Guideline: a type parameter should relate at least two things; if it appears only once, you probably don’t need it.',
    ],
    sources: [
      { label: 'TS Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
      { label: 'TS Handbook — Keyof Type Operator', url: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html' },
      {
        label: 'TS Handbook — Guidelines for writing good generic functions',
        url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#guidelines-for-writing-good-generic-functions',
      },
    ],
  },
  {
    id: 'tsq-utility-types',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'Which built-in utility types do you use most, and for what? Give a real example for a few of them.',
    keyPoints: [
      'Partial<T> (update payloads, form drafts), Required<T>, Readonly<T>.',
      'Pick<T, K> / Omit<T, K> to derive props from a model (Omit<User, "password">).',
      'Record<K, V> for dictionaries/lookup maps.',
      'ReturnType<typeof fn>, Parameters<typeof fn>, Awaited<T> to derive types from functions.',
      'NonNullable<T>, Exclude<U, X>, Extract<U, X> for union manipulation.',
      'React: ComponentProps<typeof Button> to reuse another component’s props.',
    ],
    sources: [{ label: 'TS Handbook — Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' }],
  },
  {
    id: 'tsq-mapped-conditional',
    category: 'typescript',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt: 'Implement DeepPartial<T> and ElementType<T> (element type of an array). Explain mapped types, conditional types, distribution and infer.',
    codeLang: 'ts',
    code: `type DeepPartial<T> = /* ? */;
type ElementType<T> = /* ? */;

type A = ElementType<string[]>;  // string
type B = ElementType<number>;    // never`,
    keyPoints: [
      'Mapped type iterates keys: { [K in keyof T]?: ... }, with modifiers (+/- readonly, ?) and key remapping via as.',
      'DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T (functions and arrays may need special cases).',
      'Conditional types: T extends U ? X : Y.',
      'infer captures part of a type: type ElementType<T> = T extends readonly (infer E)[] ? E : never.',
      'Conditional types distribute over unions when T is a naked type parameter; wrap in [T] to prevent it.',
    ],
    sources: [
      { label: 'TS Handbook — Mapped Types', url: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html' },
      { label: 'TS Handbook — Conditional Types', url: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html' },
    ],
  },
  {
    id: 'tsq-satisfies',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What are the types of `a.primary`, `b.primary` and `c.primary`? Explain annotation vs `as` vs `satisfies`.',
    codeLang: 'ts',
    code: `type Palette = Record<'primary' | 'secondary', string | [number, number, number]>;

const a: Palette = { primary: '#ff0000', secondary: [0, 0, 255] };
const b = { primary: '#ff0000', secondary: [0, 0, 255] } as Palette;
const c = { primary: '#ff0000', secondary: [0, 0, 255] } satisfies Palette;`,
    keyPoints: [
      'a.primary and b.primary: string | [number, number, number]; the specific type is widened to the declared type, so you can’t call .toUpperCase() without narrowing.',
      'c.primary: string; satisfies checks the value against Palette but keeps the inferred type.',
      'as is an assertion: it can lie (e.g. missing properties in some cases) and should be a last resort.',
      'Common pattern: const config = {...} as const satisfies Config.',
    ],
    sources: [
      {
        label: 'TS 4.9 release notes — The satisfies operator',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator',
      },
    ],
  },
  {
    id: 'tsq-as-const',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'What does `as const` do? How do you derive a union type from a runtime array or object so you have a single source of truth?',
    keyPoints: [
      'as const makes the most specific type possible: literal types and readonly arrays/tuples/properties.',
      'const ROLES = ["admin", "editor", "viewer"] as const; type Role = (typeof ROLES)[number];',
      'For objects: type Status = (typeof STATUS)[keyof typeof STATUS].',
      'The runtime array (for dropdowns, validation) and the type can’t drift apart.',
      'Often used instead of enums.',
    ],
    sources: [
      { label: 'TS 3.4 release notes — const assertions', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions' },
      { label: 'TS Handbook — Indexed Access Types', url: 'https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html' },
    ],
  },
  {
    id: 'tsq-enums',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'Enums vs string literal unions: which do you prefer and why? What are the known problems with enums?',
    keyPoints: [
      'Enums emit runtime code; they aren’t "just types", so they are not compatible with erasable-only tooling (Node type stripping, --erasableSyntaxOnly in TS 5.8).',
      'Numeric enums have reverse mappings and historically accepted any number.',
      'const enums cause problems with isolatedModules and library publishing.',
      'String literal unions plus as const objects give the same autocomplete without those pitfalls.',
      'Enums are acceptable when a team prefers them consistently, mainly string enums.',
    ],
    sources: [
      { label: 'TS Handbook — Enums', url: 'https://www.typescriptlang.org/docs/handbook/enums.html' },
      {
        label: 'TS 5.8 release notes — --erasableSyntaxOnly',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html#the---erasablesyntaxonly-option',
      },
    ],
  },
  {
    id: 'tsq-react-props',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'How do you type a React component’s props, children, event handlers, refs and state?',
    keyPoints: [
      'Props: an interface/type and a plain function: function Button({ label }: ButtonProps).',
      'children: React.ReactNode. React.FC no longer adds children implicitly; a plain function is the common choice.',
      'Events: React.ChangeEvent<HTMLInputElement>, React.MouseEvent<HTMLButtonElement>, or handler types like React.ChangeEventHandler<HTMLInputElement>.',
      'Refs: useRef<HTMLInputElement>(null).',
      'State with unions: useState<User | null>(null).',
      'Extend native props: interface Props extends React.ComponentProps<"button"> { variant: "primary" | "ghost" }.',
    ],
    sources: [
      { label: 'react.dev — Using TypeScript', url: 'https://react.dev/learn/typescript' },
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app/' },
    ],
  },
  {
    id: 'tsq-generic-component',
    category: 'typescript',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt: 'Write a generic <List> component so that `renderItem` and `getKey` receive the correct item type, inferred from `items`.',
    codeLang: 'tsx',
    code: `// Usage:
<List
  items={users}                       // User[]
  getKey={(u) => u.id}                // u: User
  renderItem={(u) => <span>{u.name}</span>}
/>`,
    keyPoints: [
      'interface ListProps<T> { items: T[]; getKey: (item: T) => React.Key; renderItem: (item: T) => React.ReactNode }',
      'function List<T>({ items, getKey, renderItem }: ListProps<T>) { return <ul>{items.map(i => <li key={getKey(i)}>{renderItem(i)}</li>)}</ul>; }',
      'T is inferred from items at the call site.',
      'In .tsx files, generic arrow functions need <T,> to avoid being parsed as JSX.',
      'forwardRef used to lose generics (needing casts); React 19 ref-as-prop removes that problem.',
    ],
    sources: [
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app/' },
      { label: 'TS Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
    ],
  },
  {
    id: 'tsq-polymorphic',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'How would you type a polymorphic component like <Text as="a" href="/x">? What simpler alternative exists?',
    keyPoints: [
      'Generic over the element: <E extends React.ElementType = "span">.',
      'Props: { as?: E } & Omit<React.ComponentPropsWithoutRef<E>, "as">, so valid props depend on as (href only allowed for "a").',
      'Refs and merging your own props make the types complex and can slow the compiler.',
      'Alternative: the asChild/Slot pattern (Radix): the component merges its props onto the single child element you pass, so typing stays simple.',
    ],
    sources: [
      { label: 'Radix — Composition (asChild)', url: 'https://www.radix-ui.com/primitives/docs/guides/composition' },
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app/' },
    ],
  },
  {
    id: 'tsq-unsafe-cast',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This compiles fine but crashed in production. Why, and how would you make it safe?',
    codeLang: 'ts',
    code: `interface User {
  id: string;
  email: string;
  profile: { name: string };
}

async function getDisplayName(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const user = (await res.json()) as User;
  return user.profile.name.toUpperCase();
}`,
    keyPoints: [
      'res.json() returns any; as User is a promise to the compiler, not a check. If the API returns profile: null or an error body, it crashes at runtime.',
      'Validate at the boundary with a schema (zod/valibot) and infer the type from the schema.',
      'Or treat the result as unknown and narrow with type guards.',
      'Check res.ok before parsing.',
      'Types generated from OpenAPI help, but still don’t validate at runtime.',
    ],
    sources: [
      { label: 'Zod', url: 'https://zod.dev/' },
      { label: 'TS Handbook — Type Assertions', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions' },
    ],
  },
  {
    id: 'tsq-structural',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'TypeScript uses structural typing. What does that mean in practice, what are excess property checks, and how do branded types help?',
    keyPoints: [
      'Compatibility is based on shape, not on names: any object with the required properties is assignable.',
      'Excess property checks only apply to fresh object literals; assigning a variable with extra properties is allowed.',
      'Consequence: UserId and OrderId as plain strings are interchangeable, which can hide bugs.',
      'Branded types simulate nominal typing: type UserId = string & { readonly __brand: "UserId" }, created only through a validating function.',
    ],
    sources: [{ label: 'TS Handbook — Type Compatibility', url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html' }],
  },
  {
    id: 'tsq-tsconfig',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'Which tsconfig compiler options do you consider essential for an application, and why?',
    keyPoints: [
      'strict (strictNullChecks, noImplicitAny, strictFunctionTypes, etc.).',
      'noUncheckedIndexedAccess: array/record access returns T | undefined.',
      'exactOptionalPropertyTypes, noImplicitOverride, noFallthroughCasesInSwitch.',
      'For bundler setups: moduleResolution "bundler", isolatedModules / verbatimModuleSyntax, noEmit (the bundler compiles).',
      'skipLibCheck is a speed/safety trade-off.',
    ],
    sources: [{ label: 'TSConfig Reference', url: 'https://www.typescriptlang.org/tsconfig/' }],
  },
  {
    id: 'tsq-object-keys',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Why does TypeScript reject prices[key]? What are your options, and why is TypeScript deliberately strict here?',
    codeLang: 'ts',
    code: `const prices = { apple: 1, banana: 2 };

Object.keys(prices).forEach((key) => {
  console.log(prices[key]);
  // Element implicitly has an 'any' type because expression of type 'string'
  // can't be used to index type '{ apple: number; banana: number; }'
});`,
    keyPoints: [
      'Object.keys returns string[], not (keyof T)[].',
      'Reason: with structural typing an object can have more keys at runtime than its type declares, so keyof T would be a lie.',
      'Options: Object.entries(prices); cast (Object.keys(prices) as Array<keyof typeof prices>) when you control the object; a typed helper; or type it as Record<string, number> if it is a real dictionary.',
    ],
    sources: [
      { label: 'TS Handbook — Keyof Type Operator', url: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html' },
      { label: 'TS Handbook — Type Compatibility', url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html' },
    ],
  },
  {
    id: 'tsq-overloads',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'When would you use function overloads instead of union parameters or generics?',
    keyPoints: [
      'Overloads: several call signatures followed by one implementation signature, which callers can’t see.',
      'Use them when the return type depends on the input in ways a union can’t express (e.g. createElement("a") → HTMLAnchorElement).',
      'The handbook recommends union parameters instead of overloads whenever possible.',
      'Order matters: more specific signatures first.',
      'Alternatives: generics with conditional return types, or a discriminated options object.',
    ],
    sources: [
      { label: 'TS Handbook — Function Overloads', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads' },
    ],
  },
  {
    id: 'tsq-template-literal',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'What are template literal types? Give practical use cases.',
    keyPoints: [
      'Build string literal types from other types: type EventName<T extends string> = `on${Capitalize<T>}`.',
      'Combined with mapped types: generate handler names from a props object ({ [K in keyof T as `on${Capitalize<K & string>}Change`]: ... }).',
      'Typed CSS values (`${number}px`), i18n keys, route paths with params extracted via infer.',
      'Intrinsic helpers: Uppercase, Lowercase, Capitalize, Uncapitalize.',
    ],
    sources: [
      { label: 'TS Handbook — Template Literal Types', url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html' },
    ],
  },
  {
    id: 'tsq-declarations',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'What are .d.ts files? How do you add types for an untyped package or extend a third-party type (e.g. Window, env variables, a theme)?',
    keyPoints: [
      'Declaration files describe types without implementation; libraries ship them or come from DefinitelyTyped (@types/*).',
      'Untyped package: declare module "pkg" { ... } in a .d.ts (or a quick declare module "pkg"; as a stopgap).',
      'Module augmentation / interface merging: extend Window, a library’s Theme interface, or Vite’s ImportMetaEnv.',
      'Make sure the file is included by tsconfig.',
    ],
    sources: [
      { label: 'TS Handbook — Module Augmentation', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation' },
      { label: 'TS Handbook — Declaration Files: Introduction', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' },
      { label: 'Vite — IntelliSense for TypeScript env variables', url: 'https://vite.dev/guide/env-and-mode#intellisense-for-typescript' },
    ],
  },
  {
    id: 'tsq-readonly',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'What is the difference between TypeScript’s readonly / as const and Object.freeze?',
    keyPoints: [
      'readonly properties, ReadonlyArray<T>/readonly T[] and as const are compile-time only; they disappear in the emitted JavaScript.',
      'Object.freeze works at runtime (shallow), and TS types its result as Readonly<T>.',
      'readonly is shallow too, unless you build a DeepReadonly type.',
      'Readonly props/arrays communicate "I won’t mutate this", which fits React’s immutability model.',
    ],
    sources: [
      { label: 'TS Handbook — readonly Properties', url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties' },
      { label: 'MDN — Object.freeze()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze' },
    ],
  },
  {
    id: 'tsq-filter-predicate',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'With TypeScript 5.5 or newer, what is the inferred type of `a`, `b` and `c`?',
    codeLang: 'ts',
    code: `const items = ['a', null, 'b', undefined];

const a = items.filter(Boolean);
const b = items.filter((x) => x !== null && x !== undefined);
const c = items.filter((x): x is string => typeof x === 'string');`,
    keyPoints: [
      'a: (string | null | undefined)[]. Boolean is not a type predicate, so nothing is narrowed.',
      'b: string[]. TS 5.5 infers type predicates from simple arrow functions.',
      'c: string[] via an explicit user-defined type guard (works in every version).',
      'Write explicit predicates when inference doesn’t apply, but make sure the predicate is actually true; TS trusts it.',
    ],
    sources: [
      {
        label: 'TS 5.5 release notes — Inferred Type Predicates',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#inferred-type-predicates',
      },
      { label: 'TS Handbook — Using type predicates', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates' },
    ],
  },
  {
    id: 'tsq-generic-hook',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Consumers of this hook get a type error when calling setValue. Why? Also review the rest of the hook.',
    codeLang: 'ts',
    code: `function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const [theme, setTheme] = useLocalStorage('theme', 'light');
setTheme('dark'); // error: not callable`,
    keyPoints: [
      'The returned array literal is inferred as (T | Dispatch<SetStateAction<T>>)[], an array of a union, so each element could be either.',
      'Fix: return [value, setValue] as const, or declare the tuple return type explicitly.',
      'JSON.parse returns any, so stored data is trusted blindly; validate it (or treat as unknown) and wrap in try/catch for corrupted values.',
      'localStorage access during render breaks SSR and can throw (private mode, quota).',
      'Optionally sync between tabs with the storage event.',
    ],
    sources: [
      { label: 'react.dev — Using TypeScript', url: 'https://react.dev/learn/typescript' },
      { label: 'TS 3.4 release notes — const assertions', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions' },
    ],
  },
];
