interface CodeBlockProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  return (
    <figure className="code-block">
      {lang && <figcaption className="code-lang">{lang}</figcaption>}
      <pre>
        <code>
          {code.split('\n').map((line, i) => (
            <span className="code-line" key={i}>
              {line || ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
