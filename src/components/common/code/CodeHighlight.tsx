/* eslint-disable react/no-array-index-key */
import React from 'react';
import Prism from 'prismjs';
import normalizeTokens from './normalizeTokens';
import 'prismjs/themes/prism.css';

// load language essentials
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-diff';

interface CodeHighlightProps {
  code: string;
  language?: string;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({
  code,
  language,
}) => {
  if (!language || !Prism.languages[language]) {
    // no language or not supported
    return (
      <pre
        className="language-"
        style={{
          borderRadius: 4,
        }}
      >
        {code}
      </pre>
    );
  }

  const tokens = Prism.tokenize(code, Prism.languages[language]);
  const normalizedTokens = normalizeTokens(tokens);
  return (
    <pre
      className={`language-${language}`}
      style={{
        borderRadius: 4,
      }}
    >
      <code className={`language-${language}`}>
        {normalizedTokens.map((line, lineIndex) => (
          line.length === 1
            ? (
              <span key={lineIndex} className={`token ${line[0].types.join(' ')}`}>
                {line[0].content}
              </span>
            )
            : (
              <div key={lineIndex}>
                {line.map((i, index) => (
                  <span key={index} className={`token ${i.types.join(' ')}`}>
                    {i.content}
                  </span>
                ))}
              </div>
            )
        ))}
      </code>
    </pre>
  );
};

export default CodeHighlight;
