import type { Question } from '../types';

export const accessibility: Question[] = [
  {
    id: 'a11y-div-button',
    category: 'accessibility',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'What accessibility problems does this delete control have, and how would you fix it?',
    codeLang: 'jsx',
    code: `<div className="btn" onClick={handleDelete}>
  <img src="/trash.svg" />
</div>`,
    keyPoints: [
      'A div is not focusable, has no button role and doesn’t respond to Enter/Space, so keyboard and screen reader users can’t use it.',
      'The image has no alt text, so the control has no accessible name.',
      'Fix: <button type="button" aria-label="Delete item" onClick={handleDelete}><img src="/trash.svg" alt="" /></button>.',
      'First rule of ARIA: prefer native elements over re-implementing them with roles and key handlers.',
      'eslint-plugin-jsx-a11y catches this.',
    ],
    sources: [
      { label: 'W3C — Using ARIA (first rule)', url: 'https://www.w3.org/TR/using-aria/' },
      { label: 'WAI-ARIA APG — Button pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/' },
      { label: 'eslint-plugin-jsx-a11y', url: 'https://github.com/jsx-eslint/eslint-plugin-jsx-a11y' },
    ],
  },
  {
    id: 'a11y-modal',
    category: 'accessibility',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you build an accessible modal dialog in React?',
    keyPoints: [
      'Use the native <dialog> with showModal() (gives focus trapping, inert background and Escape) or role="dialog" with aria-modal="true".',
      'Label it with aria-labelledby pointing at the title (and aria-describedby if useful).',
      'Move focus into the dialog on open; keep focus inside while open; Escape closes.',
      'Restore focus to the element that opened it when closing.',
      'Make background content inert, lock scroll; usually rendered in a portal.',
      'Test with keyboard only and a screen reader.',
    ],
    sources: [
      { label: 'WAI-ARIA APG — Dialog (Modal) pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
      { label: 'MDN — <dialog>', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog' },
    ],
  },
  {
    id: 'a11y-spa',
    category: 'accessibility',
    level: 'mid',
    type: 'concept',
    prompt: 'Which accessibility problems are specific to single-page apps, and how do you address them?',
    keyPoints: [
      'Client-side route changes aren’t announced and focus stays where it was: move focus to the new page’s heading/main or announce via a live region; update document.title.',
      'Dynamic updates (results loaded, errors, toasts) need aria-live regions.',
      'Focus is lost when the focused element is removed (deleting a list item, closing a menu): move it somewhere sensible.',
      'Provide skip links; keep loading states perceivable (aria-busy).',
    ],
    sources: [
      { label: 'Gatsby — What we learned from user testing of accessible client-side routing', url: 'https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/' },
      { label: 'MDN — ARIA live regions', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions' },
    ],
  },
  {
    id: 'a11y-forms',
    category: 'accessibility',
    level: 'junior',
    type: 'concept',
    prompt: 'What makes form fields and their error messages accessible?',
    keyPoints: [
      'Every input has a visible <label> associated via htmlFor/id (useId); a placeholder is not a label.',
      'Group related controls with <fieldset> and <legend>.',
      'Errors: aria-invalid="true" and aria-describedby pointing to the message; announce or summarise errors and focus the first invalid field.',
      'Don’t rely on colour alone; use correct input types and autocomplete attributes.',
    ],
    sources: [
      { label: 'W3C WAI — Forms Tutorial', url: 'https://www.w3.org/WAI/tutorials/forms/' },
      { label: 'react.dev — useId', url: 'https://react.dev/reference/react/useId' },
    ],
  },
  {
    id: 'a11y-process',
    category: 'accessibility',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you make sure a team ships accessible UI consistently?',
    keyPoints: [
      'Semantic HTML first; accessible primitives in the design system.',
      'Automated: eslint-plugin-jsx-a11y, axe in unit tests (jest-axe), E2E (@axe-core/playwright) and Storybook a11y addon.',
      'Role-based queries in tests surface missing names/roles.',
      'Automated tools catch only part of the issues: manual keyboard testing and screen readers (VoiceOver, NVDA) are still needed.',
      'Target WCAG 2.2 AA; include a11y in the definition of done and design reviews (contrast, focus states).',
    ],
    sources: [
      { label: 'Deque — axe', url: 'https://www.deque.com/axe/' },
      { label: 'W3C — WCAG 2.2 Quick Reference', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
    ],
  },
  {
    id: 'a11y-aria-misuse',
    category: 'accessibility',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Find the ARIA mistakes in these three snippets.',
    codeLang: 'jsx',
    code: `<button role="button" aria-label="Send" onClick={submit}>Submit order</button>

<span role="link" onClick={() => navigate('/home')}>Home</span>

<div aria-hidden="true">
  <button onClick={close}>Close</button>
</div>`,
    keyPoints: [
      'role="button" on a <button> is redundant.',
      'aria-label="Send" overrides the visible text "Submit order": voice-control users saying "click Submit order" fail (label in name).',
      'span role="link" is not focusable and doesn’t handle Enter; use <a href> or the router’s <Link>.',
      'aria-hidden on a container with a focusable button: keyboard users can focus something screen readers can’t perceive.',
      '"No ARIA is better than bad ARIA."',
    ],
    sources: [
      { label: 'WAI-ARIA APG — Read Me First', url: 'https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/' },
      { label: 'W3C — Using ARIA', url: 'https://www.w3.org/TR/using-aria/' },
    ],
  },
  {
    id: 'a11y-keyboard',
    category: 'accessibility',
    level: 'senior',
    type: 'concept',
    prompt: 'How do you implement keyboard navigation for a custom menu, listbox or tabs? Explain roving tabindex vs aria-activedescendant.',
    keyPoints: [
      'Tab moves into and out of the composite widget; arrow keys move within it; Home/End, typeahead, Escape where the pattern says so.',
      'Roving tabindex: the active item has tabIndex=0, others -1, and DOM focus moves between items.',
      'aria-activedescendant: focus stays on the container/input (e.g. combobox) and the attribute points to the active option’s id.',
      'Follow the WAI-ARIA APG pattern for each widget; prefer battle-tested primitives (Radix, React Aria).',
    ],
    sources: [
      { label: 'WAI-ARIA APG — Developing a Keyboard Interface', url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/' },
    ],
  },
];

export const security: Question[] = [
  {
    id: 'sec-xss',
    category: 'security',
    level: 'mid',
    type: 'concept',
    prompt: 'How does React protect you against XSS, and where can you still introduce XSS in a React app?',
    keyPoints: [
      'JSX escapes interpolated strings; React elements carry a $$typeof Symbol so JSON from a server can’t be injected as elements.',
      'dangerouslySetInnerHTML with untrusted HTML: sanitise with DOMPurify or avoid it.',
      'User-controlled URLs in href/src (javascript: URLs): React warns about them, but validate protocols yourself.',
      'Direct DOM access through refs (innerHTML), eval/new Function, third-party scripts.',
      'SSR: serialising state into a <script> tag without escaping.',
      'Defence in depth: Content Security Policy, Trusted Types.',
    ],
    sources: [
      { label: 'Dan Abramov — Why Do React Elements Have a $$typeof Property?', url: 'https://overreacted.io/why-do-react-elements-have-typeof-property/' },
      { label: 'OWASP — Cross Site Scripting Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
      {
        label: 'react.dev — Dangerously setting the inner HTML',
        url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html',
      },
    ],
  },
  {
    id: 'sec-user-content',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Both components render user-generated data. What are the security issues?',
    codeLang: 'jsx',
    code: `function Comment({ comment }) {
  return <div dangerouslySetInnerHTML={{ __html: comment.body }} />;
}

function ProfileLink({ user }) {
  return (
    <a href={user.website} target="_blank">
      {user.name}
    </a>
  );
}`,
    keyPoints: [
      'Stored XSS: comment.body can contain <img src=x onerror=...>. Sanitise (DOMPurify) or render as text/markdown with a safe renderer.',
      'user.website can be "javascript:..." which runs code on click: parse with new URL() and allow only http/https.',
      'target="_blank": add rel="noopener noreferrer" (modern browsers imply noopener, but be explicit for older ones and for referrer privacy).',
      'Treat all user data as untrusted, even from your own API.',
    ],
    sources: [
      { label: 'OWASP — Cross Site Scripting Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
      { label: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify' },
    ],
  },
  {
    id: 'sec-token-storage',
    category: 'security',
    level: 'senior',
    type: 'concept',
    prompt: 'Where should a single-page app store authentication tokens? Compare localStorage, cookies and memory.',
    keyPoints: [
      'localStorage/sessionStorage are readable by any script on the page: one XSS steals the token.',
      'HttpOnly, Secure, SameSite cookies can’t be read by JS, but cookies are sent automatically, so you need CSRF protection (SameSite=Lax/Strict, CSRF tokens).',
      'Common pattern: short-lived access token in memory, refresh token in an HttpOnly cookie, with rotation.',
      'Backend-for-frontend (BFF): tokens stay on the server; the browser only has a session cookie.',
      'XSS can still act as the user even if it can’t read tokens, so CSP and sanitisation still matter.',
    ],
    sources: [
      { label: 'OWASP — HTML5 Security Cheat Sheet (Local Storage)', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html' },
      { label: 'IETF — OAuth 2.0 for Browser-Based Applications', url: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps' },
      { label: 'MDN — Using HTTP cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies' },
    ],
  },
  {
    id: 'sec-cors-csrf',
    category: 'security',
    level: 'mid',
    type: 'concept',
    prompt: 'Explain CORS. Does CORS protect your API from attackers? How does it relate to CSRF?',
    keyPoints: [
      'The same-origin policy blocks scripts from reading cross-origin responses; CORS lets a server opt in via Access-Control-Allow-Origin and related headers.',
      'Non-simple requests trigger an OPTIONS preflight; credentials need Access-Control-Allow-Credentials and a specific origin (no wildcard).',
      'CORS is enforced by browsers only; curl or a server ignores it. It is not access control.',
      'Simple cross-site requests are still sent (the attacker just can’t read the response), which is exactly CSRF.',
      'CSRF defences: SameSite cookies, CSRF tokens, checking Origin.',
    ],
    sources: [
      { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
      { label: 'OWASP — CSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' },
    ],
  },
  {
    id: 'sec-env-secrets',
    category: 'security',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'What is the problem with this setup?',
    codeLang: 'ts',
    code: `// .env
VITE_STRIPE_SECRET_KEY=sk_live_51H...
VITE_API_URL=https://api.example.com

// payments.ts (runs in the browser)
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);`,
    keyPoints: [
      'Variables prefixed VITE_ (or NEXT_PUBLIC_, REACT_APP_) are inlined into the public JavaScript bundle; anyone can read the secret key.',
      'Secrets must stay on a server (API route, BFF, serverless function); the browser only gets publishable keys.',
      'Rotate the leaked key immediately.',
      'Keep .env out of git; use secret scanning in CI.',
    ],
    sources: [{ label: 'Vite — Env Variables and Modes', url: 'https://vite.dev/guide/env-and-mode' }],
  },
  {
    id: 'sec-csp',
    category: 'security',
    level: 'senior',
    type: 'concept',
    prompt: 'What is a Content Security Policy, and how would you roll one out for an existing React app?',
    keyPoints: [
      'An HTTP header that restricts where scripts, styles, images and connections can come from; limits the damage of XSS.',
      'Prefer a strict nonce- or hash-based policy; avoid unsafe-inline and unsafe-eval.',
      'Start with Content-Security-Policy-Report-Only and collect violation reports before enforcing.',
      'Watch out for inline scripts, runtime CSS-in-JS inline styles and third-party tags.',
      'Trusted Types locks down DOM XSS sinks like innerHTML.',
    ],
    sources: [
      { label: 'MDN — Content Security Policy (CSP)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP' },
      { label: 'web.dev — Mitigate XSS with a strict CSP', url: 'https://web.dev/articles/strict-csp' },
    ],
  },
  {
    id: 'sec-supply-chain',
    category: 'security',
    level: 'senior',
    type: 'concept',
    prompt: 'What supply-chain risks does a frontend project have, and how do you reduce them?',
    keyPoints: [
      'Packages can run install scripts; risks include typosquatting, compromised maintainer accounts and malicious updates (event-stream in 2018; several popular npm packages were hijacked through phishing in 2025).',
      'Commit lockfiles and use npm ci in CI.',
      'Automated audits and updates (npm audit, Dependabot/Renovate), with review and a delay before adopting brand-new versions.',
      'Evaluate new dependencies (maintenance, size, permissions); fewer dependencies is better.',
      'Subresource Integrity for scripts from CDNs; limit and sandbox third-party scripts.',
    ],
    sources: [
      { label: 'OWASP — NPM Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html' },
      { label: 'MDN — Subresource Integrity', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity' },
    ],
  },
  {
    id: 'sec-client-authz',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'A teammate says: "Admin features are secure because non-admins never see the button." Evaluate.',
    codeLang: 'jsx',
    code: `function Toolbar({ user }) {
  return (
    <>
      <ExportButton />
      {user.role === 'admin' && (
        <button onClick={() => api.delete('/api/users/all')}>Delete all users</button>
      )}
    </>
  );
}`,
    keyPoints: [
      'Client-side checks are UX only. Anyone can call the endpoint directly or edit the JS.',
      'Authorisation must be enforced on the server for every request (and inside every Server Action/Function).',
      'Don’t send sensitive data to the client and then hide it with CSS or conditionals.',
      'Also: a destructive action without confirmation and audit trail.',
    ],
    sources: [{ label: 'OWASP — Authorization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' }],
  },
];
