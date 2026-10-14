import type { Question } from '../types';

export const typescript: Question[] = [
  {
    id: 'ts-type-vs-interface',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'type alias vs interface: what are the differences, and how do you choose?',
    keyPoints: [
      'Both can describe object shapes, and classes can implement either.',
      'Interfaces support declaration merging (declaring the same interface twice merges them) and extends; that is how you add fields to Express’s Request or NodeJS.ProcessEnv.',
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
    id: 'ts-any-unknown-never',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'Explain any, unknown and never. When do you use each?',
    keyPoints: [
      'any turns off type checking and spreads silently through the code (req.body, JSON.parse and res.json() all return any); avoid it (noImplicitAny, lint rules).',
      'unknown is the safe top type: anything can be assigned to it, but you must narrow it before using it. Use it for external data, parsed JSON, message payloads and catch variables.',
      'never is the bottom type with no values: unreachable branches, exhaustiveness checks, functions that always throw (e.g. a fail(status) helper).',
      'void means "the return value is ignored"; it isn’t the same as undefined.',
    ],
    sources: [
      { label: 'TS Handbook — unknown', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown' },
      { label: 'TS Handbook — The never type', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type' },
    ],
  },
  {
    id: 'ts-utility-types',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'Which built-in utility types do you use most in backend code, and for what? Give a real example for a few of them.',
    keyPoints: [
      'Partial<T> (PATCH payloads), Required<T>, Readonly<T> (config objects).',
      'Pick<T, K> / Omit<T, K> to derive DTOs from a model (Omit<User, "passwordHash">, Omit<Order, "id" | "createdAt"> for inserts).',
      'Record<K, V> for dictionaries/lookup maps (Record<Role, Permission[]>).',
      'ReturnType<typeof fn>, Parameters<typeof fn>, Awaited<T> to derive types from functions, e.g. Awaited<ReturnType<typeof getUser>> for the resolved value of an async function.',
      'NonNullable<T>, Exclude<U, X>, Extract<U, X> for union manipulation.',
    ],
    sources: [{ label: 'TS Handbook — Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' }],
  },
  {
    id: 'ts-readonly',
    category: 'typescript',
    level: 'junior',
    type: 'concept',
    prompt: 'What is the difference between TypeScript’s readonly / as const and Object.freeze?',
    keyPoints: [
      'readonly properties, ReadonlyArray<T>/readonly T[] and as const are compile-time only; they disappear in the emitted JavaScript.',
      'Object.freeze works at runtime (shallow), and TS types its result as Readonly<T>.',
      'readonly is shallow too, unless you build a DeepReadonly type.',
      'Readonly parameters and config types communicate "I won’t mutate this" and catch accidental writes to objects shared across requests; freeze them too if untyped JS can reach them.',
    ],
    sources: [
      { label: 'TS Handbook — readonly Properties', url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties' },
      { label: 'MDN — Object.freeze()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze' },
    ],
  },
  {
    id: 'ts-unknown-catch',
    category: 'typescript',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'With "strict": true this handler doesn’t compile. Why does TypeScript type err this way, and how should the catch block look?',
    codeLang: 'ts',
    code: `app.post('/orders', async (req, res) => {
  try {
    const order = await orderService.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    logger.error(err.message); // error: 'err' is of type 'unknown'
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
});`,
    keyPoints: [
      'Under strict (useUnknownInCatchVariables, added in TS 4.4) catch variables are unknown, because JavaScript can throw anything (strings, plain objects, null), and a library may reject with a non-Error value.',
      'Narrow before use: if (err instanceof HttpError) { ... } else if (err instanceof Error) { ... } else { ... }; custom error classes with a status field make this clean.',
      'You can only annotate a catch variable as any or unknown (catch (err: Error) is a compile error); catch (err: any) just switches the safety off.',
      'Don’t send err.message to clients for unexpected errors (it can leak internals); log the full error with its stack/cause and return a generic 500.',
      'Callbacks of promise.catch((err) => ...) are still typed any by default, so the same discipline applies there.',
    ],
    sources: [
      {
        label: 'TS 4.4 release notes — unknown in catch variables',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#using-unknown-in-catch-variables',
      },
      { label: 'TSConfig — useUnknownInCatchVariables', url: 'https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables' },
    ],
  },
  {
    id: 'ts-narrowing',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'How does narrowing work in TypeScript? List the techniques you use.',
    keyPoints: [
      'Control-flow analysis narrows a union type inside branches.',
      'typeof, instanceof, the in operator, equality checks, truthiness checks.',
      'Discriminated unions (switch on a literal "kind"/"type"/"ok" field).',
      'User-defined type guards (x is T) and assertion functions (asserts x is T), e.g. assertIsDefined(user) after a lookup.',
      'TS 5.5+ infers type predicates from simple arrow functions, e.g. rows.filter(r => r !== undefined).',
    ],
    sources: [{ label: 'TS Handbook — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' }],
  },
  {
    id: 'ts-result-type',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Why does TypeScript complain on the marked line, and how would you model service results better?',
    codeLang: 'ts',
    code: `interface ServiceResult {
  ok: boolean;
  user?: User;
  error?: 'EMAIL_TAKEN' | 'INVALID_INVITE';
}

async function registerUser(input: NewUser): Promise<ServiceResult> {
  // ...
}

const result = await registerUser(input);
if (result.ok) {
  res.status(201).json({ id: result.user.id }); // error: 'result.user' is possibly 'undefined'
}`,
    keyPoints: [
      'Optional fields allow impossible states (ok with no user, failure with a user, neither error nor user), so checking ok doesn’t narrow user.',
      'Use a discriminated union: type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }. Checking result.ok now narrows to the right member.',
      'Model errors as a union of literals or tagged objects ({ type: "EMAIL_TAKEN"; email: string }) and map them to HTTP statuses with an exhaustive switch.',
      'Return expected domain failures as values; keep throwing for unexpected ones (DB down, bugs) and handle those in central error middleware.',
      'Libraries like neverthrow offer the same idea with helpers, but a plain union type is often enough.',
    ],
    sources: [
      { label: 'TS Handbook — Discriminated unions', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions' },
    ],
  },
  {
    id: 'ts-exhaustive',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'A teammate added "RATE_LIMITED" to DomainError. What happens here, and how do you make the compiler catch every missing case in general?',
    codeLang: 'ts',
    code: `type DomainError =
  | { type: 'NOT_FOUND'; resource: string }
  | { type: 'CONFLICT'; message: string }
  | { type: 'RATE_LIMITED'; retryAfterSec: number };

function toHttpStatus(error: DomainError): number {
  switch (error.type) {
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
  }
}`,
    keyPoints: [
      'With the explicit number return type and strict mode, TS reports that the function lacks an ending return statement. That only works by accident; a handler that returns void or a switch used for side effects (e.g. setting headers) would fail silently.',
      'Add a default branch: const _exhaustive: never = error; (or assertNever(error)). Any unhandled member then becomes a compile error at the exact spot.',
      'Alternative: error satisfies never in the default branch, or the switch-exhaustiveness-check lint rule.',
      'At runtime the default branch should still throw: data from outside (a queue message, an old client) can contain values the types don’t know about.',
    ],
    sources: [
      { label: 'TS Handbook — Exhaustiveness checking', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking' },
    ],
  },
  {
    id: 'ts-repository-generics',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Write a generic `Repository<T>` (an in-memory one is fine) so that the calls below type-check or fail as described. Explain each constraint you used.',
    codeLang: 'ts',
    code: `interface User {
  id: string;
  email: string;
  age: number;
}

const users = new InMemoryRepository<User>();

await users.findById('u1');                  // Promise<User | undefined>
await users.findBy('email', 'ada@x.dev');    // Promise<User[]>
await users.findBy('age', '36');             // error: '36' is not a number
await users.findBy('emial', 'x');            // error: not a key of User
await users.update('u1', { id: 'u2' });      // error: id can't be patched
new InMemoryRepository<{ name: string }>();  // error: entities need an id`,
    keyPoints: [
      'class InMemoryRepository<T extends { id: string }>: the constraint guarantees every entity has an id the repository can index by.',
      'findBy<K extends keyof T>(field: K, value: T[K]): Promise<T[]>. K is restricted to real keys and T[K] (indexed access) ties the value type to that key.',
      'update(id: string, patch: Partial<Omit<T, "id">>): Promise<T | undefined> derives the patch type from the entity, so id can’t be changed.',
      'Type arguments for methods are inferred from the call; you only pass T once when creating the repository.',
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
    id: 'ts-satisfies',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What are the types of `a.login`, `b.login` and `c.login`? Explain annotation vs `as` vs `satisfies`.',
    codeLang: 'ts',
    code: `type Limits = Record<'api' | 'login', number | { windowMs: number; max: number }>;

const a: Limits = { api: 100, login: { windowMs: 60_000, max: 5 } };
const b = { api: 100, login: { windowMs: 60_000, max: 5 } } as Limits;
const c = { api: 100, login: { windowMs: 60_000, max: 5 } } satisfies Limits;`,
    keyPoints: [
      'a.login and b.login: number | { windowMs: number; max: number }; the specific type is widened to the declared type, so you can’t read .max without narrowing.',
      'c.login: { windowMs: number; max: number } (and c.api is number); satisfies checks the value against Limits but keeps the inferred type.',
      'as is an assertion: it can lie (e.g. missing properties in some cases) and should be a last resort.',
      'Common pattern for config and route tables: const config = {...} as const satisfies Config.',
    ],
    sources: [
      {
        label: 'TS 4.9 release notes — The satisfies operator',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator',
      },
    ],
  },
  {
    id: 'ts-enums',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt:
      'Enums vs string literal unions: which do you prefer and why? How do you derive a union type from a runtime array so you have a single source of truth?',
    keyPoints: [
      'Enums emit runtime code; they aren’t "just types", so Node’s built-in type stripping rejects them (ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX) and erasableSyntaxOnly (TS 5.8) flags them.',
      'Numeric enums have reverse mappings and historically accepted any number; const enums cause problems with isolatedModules and library publishing.',
      'as const gives literal types: const ROLES = ["admin", "member"] as const; type Role = (typeof ROLES)[number]; for objects: (typeof STATUS)[keyof typeof STATUS].',
      'The runtime array (for validation, z.enum(ROLES), DB check constraints) and the type can’t drift apart.',
      'Enums are acceptable when a team prefers them consistently and compiles with tsc, mainly string enums.',
    ],
    sources: [
      { label: 'TS Handbook — Enums', url: 'https://www.typescriptlang.org/docs/handbook/enums.html' },
      {
        label: 'TS 5.8 release notes — --erasableSyntaxOnly',
        url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html#the---erasablesyntaxonly-option',
      },
      { label: 'TS 3.4 release notes — const assertions', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions' },
    ],
  },
  {
    id: 'ts-validate-body',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This compiles fine but produced 500s and bad rows in production. Why, and how would you make it safe?',
    codeLang: 'ts',
    code: `interface CreateUser {
  email: string;
  name: string;
  age?: number;
}

app.post('/users', async (req, res) => {
  const body = req.body as CreateUser;
  const user = await db.users.insert({
    email: body.email.toLowerCase(),
    name: body.name,
    age: body.age,
  });
  res.status(201).json(user);
});`,
    keyPoints: [
      'Types are erased at compile time; req.body is any and as CreateUser is a promise to the compiler, not a check. {} crashes on toLowerCase (500), "age": "abc" reaches the database.',
      'Validate at the boundary with a schema and infer the type from it: const CreateUser = z.object({ email: z.email(), name: z.string().min(1), age: z.number().int().positive().optional() }); type CreateUser = z.infer<typeof CreateUser>.',
      'Use safeParse and return 400 with the issues on failure; only result.data is typed and trusted.',
      'Zod object schemas strip unknown keys by default, which also blocks mass assignment (isAdmin: true) when you pass the parsed object on; z.strictObject rejects them instead.',
      'Query strings and route params are always strings (use z.coerce.number() for ?page=2); treat env vars, queue messages and responses from other services the same way. Alternatives: valibot, or JSON Schema with ajv/Fastify.',
    ],
    sources: [
      { label: 'Zod — Basic usage', url: 'https://zod.dev/basics' },
      { label: 'Zod — Defining schemas', url: 'https://zod.dev/api' },
      { label: 'TS Handbook — Type Assertions', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions' },
    ],
  },
  {
    id: 'ts-node-tsconfig',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'package.json has "type": "module" and src/index.ts contains `import { db } from \'./db\';`. With this tsconfig.json, tsc builds without errors, but `node dist/index.js` crashes with ERR_MODULE_NOT_FOUND. Why? What would you change, and which other options do you set for a Node service?',
    codeLang: 'json',
    code: `{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}`,
    keyPoints: [
      'moduleResolution "bundler" assumes a bundler will resolve extensionless specifiers. tsc emits import "./db" unchanged, and Node’s ESM resolver needs the full path with extension, so dist/db is not found.',
      'Use "module": "nodenext" (which implies moduleResolution nodenext): it models Node’s real rules, reads "type" from package.json, and then reports TS2835, asking for "./db.js" (TypeScript maps it back to db.ts).',
      'Running .ts directly with Node’s type stripping: import "./db.ts" with allowImportingTsExtensions (noEmit) or rewriteRelativeImportExtensions (TS 5.7) when you also emit JS.',
      'Also: target/lib matching the runtime (or extend @tsconfig/node24), verbatimModuleSyntax, noUncheckedIndexedAccess, sourceMap with node --enable-source-maps, and "types": ["node"]: since TS 6.0 types defaults to [], so process and Buffer aren’t found otherwise.',
      'The old moduleResolution "node" (node10) doesn’t understand package.json "exports" and is removed in TypeScript 7.',
    ],
    sources: [
      {
        label: 'TS Handbook — Modules: Choosing compiler options',
        url: 'https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html',
      },
      { label: 'TSConfig — module', url: 'https://www.typescriptlang.org/tsconfig/#module' },
      { label: 'TS 6.0 release notes — types now defaults to []', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html#types-now-defaults-to-' },
      { label: 'tsconfig/bases', url: 'https://github.com/tsconfig/bases' },
    ],
  },
  {
    id: 'ts-run-in-node',
    category: 'typescript',
    level: 'mid',
    type: 'concept',
    prompt: 'What are the options for running TypeScript in Node: tsc build, tsx, or Node’s built-in type stripping? What are the trade-offs and limits of each?',
    keyPoints: [
      'tsc build: type-checks and emits JS to dist, then node dist/index.js; supports every TS feature and has no runtime dependency, but adds a build step.',
      'tsx (esbuild-based): runs .ts directly, transpiles enums, namespaces and parameter properties, supports tsconfig paths and watch mode; great for dev and scripts, but it doesn’t type-check and only honours some tsconfig options.',
      'Node type stripping (on by default in current releases, stable since v24.12/v25.2): replaces types with whitespace, so no source maps are needed; no type checking, ignores tsconfig (no paths, no downlevelling), refuses .ts files under node_modules, needs explicit extensions and import type.',
      'Stripping fails with ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX on syntax that needs code generation: enums, namespaces with runtime code, parameter properties, import aliases; decorators are a parse error. Enable erasableSyntaxOnly and verbatimModuleSyntax so tsc flags these.',
      'Whatever runs the code, run tsc --noEmit in CI and the editor: nothing at runtime checks your types.',
    ],
    sources: [
      { label: 'Node.js — Modules: TypeScript', url: 'https://nodejs.org/api/typescript.html' },
      { label: 'tsx — TypeScript', url: 'https://tsx.hirok.io/typescript' },
      { label: 'TSConfig — erasableSyntaxOnly', url: 'https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly' },
    ],
  },
  {
    id: 'ts-express-augment',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt: 'Make `req.user` type-check in both files without casting. Write the declaration you would add and explain where it lives and why it works.',
    codeLang: 'ts',
    code: `// auth.middleware.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = verifyToken(req.headers.authorization);
  if (!user) return res.sendStatus(401);
  req.user = user; // error: Property 'user' does not exist on type 'Request'
  next();
}

// orders.routes.ts
router.get('/orders', requireAuth, (req, res) => {
  res.json(listOrdersFor(req.user.id));
});`,
    keyPoints: [
      'Add e.g. src/types/express.d.ts: import type { User } from "../users/user.js"; declare global { namespace Express { interface Request { user?: User } } } export {};',
      'Express’s type definitions declare open global interfaces (Express.Request, Express.Response) for exactly this; interfaces merge, a type alias couldn’t be augmented.',
      'The file must be a module (an import or export {}) for declare global to be allowed, and it must be included by tsconfig, otherwise the augmentation silently doesn’t apply.',
      'user is optional because not every route runs requireAuth, so the handler still needs a guard; a helper like getAuthUser(req) that throws a 401 error keeps handlers clean without req.user!.',
      'Framework equivalents use module augmentation, e.g. declare module "fastify" { interface FastifyRequest { user?: User } }.',
    ],
    sources: [
      { label: 'TS Handbook — Global augmentation', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation' },
      { label: 'TS Handbook — Module augmentation', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation' },
      {
        label: 'DefinitelyTyped — express-serve-static-core types',
        url: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts',
      },
    ],
  },
  {
    id: 'ts-env-config',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review how this service reads its configuration. What can go wrong, and how would you structure typed config instead?',
    codeLang: 'ts',
    code: `// db.ts
export const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// server.ts
const port = process.env.PORT || 3000;
app.listen(port);

// mailer.ts
if (process.env.ENABLE_EMAILS) {
  await sendWelcomeEmail(user);
}`,
    keyPoints: [
      'process.env values are string | undefined and always strings at runtime. The ! only silences the compiler: a missing DATABASE_URL fails later, inside the first query, not at startup.',
      'port is string | number; ENABLE_EMAILS="false" is a non-empty string, so it is truthy and emails are sent.',
      'Parse once at startup into a typed, frozen config object and fail fast with a clear message: z.object({ DATABASE_URL: z.url(), PORT: z.coerce.number().int().default(3000), ENABLE_EMAILS: z.stringbool().default(false) }).parse(process.env).',
      'Beware z.coerce.boolean(): it uses Boolean(), so "false" becomes true. Import the config module everywhere instead of reading process.env ad hoc, and never log it whole (secrets).',
      'Augmenting NodeJS.ProcessEnv (interface ProcessEnv { DATABASE_URL: string }) only changes types and gives no runtime guarantee; node --env-file / process.loadEnvFile() load .env files but don’t validate.',
    ],
    sources: [
      { label: 'Zod — Defining schemas', url: 'https://zod.dev/api' },
      { label: 'Node.js — process.env', url: 'https://nodejs.org/api/process.html#processenv' },
      { label: 'Node.js — --env-file', url: 'https://nodejs.org/api/cli.html#--env-filefile' },
    ],
  },
  {
    id: 'ts-branded-ids',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'The arguments are swapped, yet this compiles. Explain why with structural typing, then change the types so that swapping a UserId and an OrderId is a compile error.',
    codeLang: 'ts',
    code: `type UserId = string;
type OrderId = string;

async function cancelOrder(orderId: OrderId, requestedBy: UserId) {
  // ...
}

const userId: UserId = req.user.id;
const orderId: OrderId = req.params.orderId;

await cancelOrder(userId, orderId); // swapped, but no error`,
    keyPoints: [
      'TypeScript compares types by structure, not by name: a type alias is just another name for string, so UserId and OrderId are interchangeable.',
      'Brand them: type Brand<T, B extends string> = T & { readonly __brand: B }; type UserId = Brand<string, "UserId">; type OrderId = Brand<string, "OrderId">. A unique symbol key keeps the brand from being forged by accident.',
      'Create branded values only at trust boundaries through a function that validates and casts once (toUserId(raw) checking the UUID format), or with zod: z.uuid().brand<"UserId">() so z.infer yields the branded type.',
      'A branded value is still assignable to string (DB drivers, logs) but a plain string is not assignable to UserId; brands are erased, so there is no runtime cost.',
      'Related structural rule: excess property checks only apply to fresh object literals; assigning a variable with extra properties is allowed.',
    ],
    sources: [
      { label: 'TS Handbook — Type Compatibility', url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html' },
      { label: 'Zod — Defining schemas', url: 'https://zod.dev/api' },
    ],
  },
  {
    id: 'ts-object-keys',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Why does TypeScript reject limits[plan]? What are your options, and why is TypeScript deliberately strict here?',
    codeLang: 'ts',
    code: `const limits = { free: 100, pro: 1000 };

Object.keys(limits).forEach((plan) => {
  console.log(plan, limits[plan]);
  // Element implicitly has an 'any' type because expression of type 'string'
  // can't be used to index type '{ free: number; pro: number; }'
});`,
    keyPoints: [
      'Object.keys returns string[], not (keyof T)[].',
      'Reason: with structural typing an object can have more keys at runtime than its type declares, so keyof T would be a lie.',
      'Options: Object.entries(limits); cast (Object.keys(limits) as Array<keyof typeof limits>) when you control the object; a typed helper; or type it as Record<string, number> if it is a real dictionary.',
    ],
    sources: [
      { label: 'TS Handbook — Keyof Type Operator', url: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html' },
      { label: 'TS Handbook — Type Compatibility', url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html' },
    ],
  },
  {
    id: 'ts-infer-service-types',
    category: 'typescript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What are the types A, B, C and D? When is deriving types from an implementation like this a good idea, and when is it not?',
    codeLang: 'ts',
    code: `interface User { id: string; email: string }
declare const db: { findUser(id: string): Promise<User | null> };

function createUserService() {
  return {
    async getById(id: string) {
      const user = await db.findUser(id);
      if (!user) throw new Error('User not found');
      return user;
    },
    toDto(user: User) {
      return { id: user.id, email: user.email.toLowerCase() };
    },
  };
}

type UserService = ReturnType<typeof createUserService>;
type A = ReturnType<UserService['getById']>;
type B = Awaited<A>;
type C = ReturnType<UserService['toDto']>;
type D = Parameters<UserService['getById']>[0];`,
    keyPoints: [
      'A: Promise<User>; B: User; C: { id: string; email: string }; D: string.',
      'The throw narrows away null, so getById’s inferred return type is Promise<User>, not Promise<User | null>.',
      'typeof brings a value into type position; ReturnType/Parameters read a function type, indexed access (UserService["getById"]) picks a member, and Awaited unwraps promises recursively.',
      'Useful with factory-function services and DI: one source of truth, no hand-written interface to keep in sync.',
      'Downside: the implementation now defines the public contract, so a refactor can change it silently; at module or package boundaries prefer an explicit interface or return type.',
    ],
    sources: [
      { label: 'TS Handbook — Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
      { label: 'TS Handbook — Typeof Type Operator', url: 'https://www.typescriptlang.org/docs/handbook/2/typeof-types.html' },
      { label: 'TS Handbook — Indexed Access Types', url: 'https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html' },
    ],
  },
  {
    id: 'ts-mapped-conditional',
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
      'DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T. Functions, arrays and built-ins like Date need special cases (a Date field would otherwise accept {}).',
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
    id: 'ts-erasable-syntax',
    category: 'typescript',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This file type-checks with tsc --noEmit (allowImportingTsExtensions is on) and runs under tsx, but `node src/server.ts` with Node’s built-in type stripping crashes. Find every problem, fix the code, and say how you would catch this at compile time.',
    codeLang: 'ts',
    code: `import { User } from './types.ts';

enum Status {
  Active = 'active',
  Banned = 'banned',
}

export class UserService {
  constructor(private readonly users: Map<string, User>) {}

  ban(id: string) {
    const user = this.users.get(id);
    if (user) user.status = Status.Banned;
  }
}`,
    keyPoints: [
      'enum needs generated JavaScript, so Node throws ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX. Replace it with const Status = { Active: "active", Banned: "banned" } as const; type Status = (typeof Status)[keyof typeof Status].',
      'The parameter property (private readonly users) also needs code generation (an assignment in the constructor). Declare the field explicitly and assign it in the constructor body (or use a #private field).',
      'import { User } is kept as a value import because the stripper doesn’t know User is only a type; at runtime the ES module fails with "does not provide an export named \'User\'". Use import type { User }.',
      'Turn on erasableSyntaxOnly (TS1294 for enums and parameter properties) and verbatimModuleSyntax (TS1484 for the type import) so tsc reports all three before anything runs.',
      'tsx worked because it transpiles each file with esbuild, which generates code for these constructs; type stripping deliberately only removes types.',
    ],
    sources: [
      { label: 'Node.js — Modules: TypeScript', url: 'https://nodejs.org/api/typescript.html#typescript-features' },
      { label: 'TSConfig — erasableSyntaxOnly', url: 'https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly' },
      { label: 'TSConfig — verbatimModuleSyntax', url: 'https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax' },
      { label: 'TS Handbook — Parameter Properties', url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties' },
    ],
  },
  {
    id: 'ts-typed-emitter',
    category: 'typescript',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement `OrderEmitter` so that listeners get typed arguments, `emit` checks its arguments, and a typo in an event name is a compile error. What does the built-in EventEmitter typing give you on its own?',
    codeLang: 'ts',
    code: `import { EventEmitter } from 'node:events';

interface Order { id: string; total: number }

type OrderEvents = {
  created: [order: Order];
  failed: [orderId: string, error: Error];
};

class OrderEmitter {
  // your implementation
}

const orders = new OrderEmitter();
orders.on('failed', (orderId, error) => {});  // orderId: string, error: Error
orders.emit('created', { id: 'o1', total: 42 });
orders.emit('created');                       // should be an error
orders.on('creatd', () => {});                // should be an error`,
    keyPoints: [
      'An event map from event name to a tuple of listener arguments (labelled tuple elements document them).',
      'Generic methods: on<K extends keyof OrderEvents>(event: K, listener: (...args: OrderEvents[K]) => void): this and emit<K extends keyof OrderEvents>(event: K, ...args: OrderEvents[K]): boolean.',
      'Delegate to a private EventEmitter (composition) instead of extending it, so untyped inherited methods don’t leak; make it generic (TypedEmitter<Events extends Record<string, unknown[]>>) to reuse it.',
      'Recent @types/node make EventEmitter itself generic: new EventEmitter<OrderEvents>() types listeners and emit arguments for declared events, but an undeclared name still falls back to any[], so a typo isn’t caught.',
      'Remember "error" semantics: emitting "error" with no listener throws, so declare it in the map and always listen for it.',
    ],
    sources: [
      { label: 'Node.js — Events', url: 'https://nodejs.org/api/events.html' },
      { label: 'DefinitelyTyped — @types/node events.d.ts', url: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/events.d.ts' },
      { label: 'TS Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
    ],
  },
  {
    id: 'ts-overloads',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'When would you use function overloads instead of union parameters or generics?',
    keyPoints: [
      'Overloads: several call signatures followed by one implementation signature, which callers can’t see.',
      'Use them when the return type depends on the input in ways a union can’t express; Node’s own typings do this: readFile(path) resolves to a Buffer, readFile(path, "utf8") to a string.',
      'The handbook recommends union parameters instead of overloads whenever possible.',
      'Order matters: more specific signatures first.',
      'Alternatives: generics with conditional return types, or a discriminated options object.',
    ],
    sources: [
      { label: 'TS Handbook — Function Overloads', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads' },
    ],
  },
  {
    id: 'ts-template-literal',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'What are template literal types? Give practical backend use cases.',
    keyPoints: [
      'Build string literal types from other types: type Topic = `${"user" | "order"}.${"created" | "deleted"}` for message-queue topics or event names.',
      'Combined with infer they parse strings at the type level: Express’s typings extract route params, so req.params is { id: string; orderId: string } for "/users/:id/orders/:orderId".',
      'Combined with mapped types and key remapping: generate method names from a model ({ [K in keyof T as `findBy${Capitalize<K & string>}`]: ... }).',
      'Intrinsic helpers: Uppercase, Lowercase, Capitalize, Uncapitalize. Recursive string types can slow the compiler, so keep them shallow.',
    ],
    sources: [
      { label: 'TS Handbook — Template Literal Types', url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html' },
      {
        label: 'DefinitelyTyped — express-serve-static-core (RouteParameters)',
        url: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts',
      },
    ],
  },
  {
    id: 'ts-project-references',
    category: 'typescript',
    level: 'senior',
    type: 'concept',
    prompt: 'Your monorepo has apps/api, apps/worker and packages/shared. How do you set up TypeScript so builds and type-checking stay fast and boundaries stay clean?',
    keyPoints: [
      'Project references: each package gets its own tsconfig with "composite": true (declaration output on, rootDir and file list fixed), and dependents list it in "references".',
      'tsc -b builds projects in dependency order, skips up-to-date ones using .tsbuildinfo, and checks consumers against the emitted .d.ts files instead of re-checking the sources.',
      'Composite projects must match all their implementation files with include/files, so reaching into another package’s sources is an error; dependencies become explicit edges in the references graph.',
      'Combine with package-manager workspaces and an "exports" field (with a "types" condition) in each package so runtime resolution and type resolution agree; a shared base tsconfig keeps options consistent.',
      'The alternative of path aliases to sources is simpler but checks everything as one big program; a faster compiler (TypeScript 7’s native port) reduces that cost but doesn’t give you the boundaries.',
    ],
    sources: [
      { label: 'TS Handbook — Project References', url: 'https://www.typescriptlang.org/docs/handbook/project-references.html' },
      { label: 'TSConfig — composite', url: 'https://www.typescriptlang.org/tsconfig/#composite' },
      { label: 'TS Handbook — Modules reference', url: 'https://www.typescriptlang.org/docs/handbook/modules/reference.html' },
    ],
  },
];
