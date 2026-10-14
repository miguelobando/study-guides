import type { Question } from '../types';

export const testing: Question[] = [
  {
    id: 'ts-rtl-philosophy',
    category: 'testing',
    level: 'junior',
    type: 'concept',
    prompt: 'What is React Testing Library’s philosophy, and how is it different from Enzyme-style testing?',
    keyPoints: [
      '"The more your tests resemble the way your software is used, the more confidence they can give you."',
      'Test behaviour the user can observe (text, roles, labels), not implementation details (state, instance methods, internal component names).',
      'Tests survive refactors that don’t change behaviour.',
      'Enzyme encouraged shallow rendering and reaching into state; it has no official adapter for React 18+.',
    ],
    sources: [
      { label: 'Testing Library — Guiding Principles', url: 'https://testing-library.com/docs/guiding-principles' },
      { label: 'Kent C. Dodds — Testing Implementation Details', url: 'https://kentcdodds.com/blog/testing-implementation-details' },
    ],
  },
  {
    id: 'ts-queries',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt: 'Which Testing Library queries should you prefer, and what is the difference between getBy, queryBy and findBy?',
    keyPoints: [
      'Priority: getByRole (with { name }), getByLabelText, getByPlaceholderText, getByText, getByDisplayValue, alt/title, and getByTestId last.',
      'Role queries double as an accessibility check.',
      'getBy throws when nothing matches; queryBy returns null (use it to assert absence); findBy returns a promise and retries (async UI).',
      '*AllBy variants return arrays.',
      'Use screen, and user-event instead of fireEvent for realistic interactions.',
    ],
    sources: [
      { label: 'Testing Library — Query priority', url: 'https://testing-library.com/docs/queries/about#priority' },
      { label: 'Kent C. Dodds — Common mistakes with React Testing Library', url: 'https://kentcdodds.com/blog/common-mistakes-with-react-testing-library' },
    ],
  },
  {
    id: 'ts-bad-test',
    category: 'testing',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review this test. What would you change?',
    codeLang: 'jsx',
    code: `test('increments', async () => {
  const { container } = render(<Counter />);
  const button = container.querySelector('.btn-primary');

  fireEvent.click(button);

  await waitFor(() => {
    fireEvent.click(button);
    expect(container.querySelector('span').textContent).toBe('2');
  });
});`,
    keyPoints: [
      'CSS class selectors via container.querySelector couple the test to implementation; use screen.getByRole("button", { name: /increment/i }).',
      'Side effects inside waitFor: the callback may run many times, clicking repeatedly.',
      'waitFor isn’t needed for synchronous updates.',
      'Prefer userEvent (const user = userEvent.setup(); await user.click(...)).',
      'Use jest-dom matchers: expect(screen.getByText("2")).toBeInTheDocument() or toHaveTextContent.',
    ],
    sources: [{ label: 'Kent C. Dodds — Common mistakes with React Testing Library', url: 'https://kentcdodds.com/blog/common-mistakes-with-react-testing-library' }],
  },
  {
    id: 'ts-network',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you test components that fetch data?',
    keyPoints: [
      'Mock at the network level with MSW so the real fetch/client code runs; handlers can be reused in Storybook and local development.',
      'Avoid mocking fetch or axios per test; it couples tests to the transport.',
      'Test loading, success, empty and error states; use findBy* for async UI.',
      'With TanStack Query: a fresh QueryClient per test, retries off.',
    ],
    sources: [
      { label: 'MSW — Documentation', url: 'https://mswjs.io/docs/' },
      { label: 'TkDodo — Testing React Query', url: 'https://tkdodo.eu/blog/testing-react-query' },
    ],
  },
  {
    id: 'ts-strategy',
    category: 'testing',
    level: 'senior',
    type: 'concept',
    prompt: 'Describe your testing strategy for a frontend product. How do you split effort between unit, integration and end-to-end tests?',
    keyPoints: [
      'Testing trophy: static analysis (TypeScript, ESLint) at the base, some unit tests, most effort in integration tests, a focused set of E2E tests.',
      'Unit tests for pure logic (reducers, utilities, formatting).',
      'Integration tests render features with real children, mocking only the network.',
      'E2E (Playwright/Cypress) for critical user journeys: login, checkout.',
      'Plus visual regression for the design system and contract tests for APIs.',
      'Coverage is a signal, not a target; keep tests fast and non-flaky.',
    ],
    sources: [
      { label: 'Kent C. Dodds — The Testing Trophy and Testing Classifications', url: 'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications' },
      { label: 'Martin Fowler — The Practical Test Pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
    ],
  },
  {
    id: 'ts-hooks',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you test a custom hook?',
    keyPoints: [
      'If it’s an implementation detail of one component, test it through that component’s UI.',
      'For reusable hooks: renderHook from @testing-library/react (the separate react-hooks-testing-library is deprecated).',
      'Wrap state updates in act; await async results with waitFor.',
      'Provide context via the wrapper option.',
    ],
    sources: [{ label: 'Testing Library — renderHook', url: 'https://testing-library.com/docs/react-testing-library/api#renderhook' }],
  },
  {
    id: 'ts-act-warning',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt: 'What does the "An update to X inside a test was not wrapped in act(...)" warning mean, and how do you fix it properly?',
    keyPoints: [
      'A state update happened that the test didn’t wait for, usually after a promise resolved or a timer fired once the test had already finished its synchronous part.',
      'It means your assertions may run against an intermediate UI.',
      'Fix by waiting for the final UI: await screen.findBy..., or await waitFor(...).',
      'Testing Library’s render, user-event and waitFor already wrap act; wrapping things in act manually is rarely the right fix.',
      'With fake timers, advance them inside act.',
    ],
    sources: [
      { label: 'Kent C. Dodds — Fix the "not wrapped in act(...)" warning', url: 'https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning' },
      { label: 'react.dev — act', url: 'https://react.dev/reference/react/act' },
    ],
  },
  {
    id: 'ts-snapshots',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt: 'What are the pros and cons of snapshot tests? When are they appropriate?',
    keyPoints: [
      'Pros: cheap to write, catch unexpected changes in output.',
      'Cons: large snapshots are hard to review and get updated blindly; they don’t express intent; they break on irrelevant markup changes.',
      'Appropriate: small, focused (inline) snapshots of serialised data or error messages.',
      'For visual appearance prefer visual regression testing; for behaviour, explicit assertions.',
    ],
    sources: [
      { label: 'Jest — Snapshot Testing', url: 'https://jestjs.io/docs/snapshot-testing' },
      { label: 'Kent C. Dodds — Effective Snapshot Testing', url: 'https://kentcdodds.com/blog/effective-snapshot-testing' },
    ],
  },
  {
    id: 'ts-flaky-e2e',
    category: 'testing',
    level: 'senior',
    type: 'concept',
    prompt: 'Your E2E suite is flaky in CI. How do you make it reliable?',
    keyPoints: [
      'No fixed sleeps: use auto-waiting locators and web-first assertions.',
      'Isolate data: seed/reset per test, no dependence on test order.',
      'Mock or stub third-party services; control time and randomness.',
      'Resilient selectors (role, label, test id) instead of CSS structure.',
      'Capture traces/videos on failure, quarantine flaky tests and fix the root cause; retries only as a safety net.',
    ],
    sources: [{ label: 'Playwright — Best Practices', url: 'https://playwright.dev/docs/best-practices' }],
  },
  {
    id: 'ts-login-form',
    category: 'testing',
    level: 'junior',
    type: 'concept',
    prompt: 'You built a login form (email, password, submit). Which tests would you write?',
    keyPoints: [
      'Fields are rendered with accessible labels.',
      'Validation messages for empty or invalid input; no request is sent.',
      'Submitting valid credentials calls the API (mocked with MSW) and redirects or shows success.',
      'Server error (401/500) shows an error message.',
      'Submit button disabled/pending while the request is in flight; no double submit.',
      'Enter key submits; optional automated a11y check (axe).',
    ],
    sources: [
      { label: 'Testing Library — Guiding Principles', url: 'https://testing-library.com/docs/guiding-principles' },
      { label: 'jest-axe', url: 'https://github.com/nickcolley/jest-axe' },
    ],
  },
];
