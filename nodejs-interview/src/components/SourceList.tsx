import type { Source } from '../types';

interface SourceListProps {
  sources: Source[];
  title?: string;
}

export function SourceList({ sources, title = 'Sources' }: SourceListProps) {
  return (
    <section className="sources" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
            <span className="source-url">{new URL(s.url).hostname}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
