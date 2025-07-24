// copied from prism-react-renderer
// https://github.com/FormidableLabs/prism-react-renderer/blob/master/packages/prism-react-renderer/src/utils/normalizeTokens.ts

import type { Token as PrismToken, TokenStream } from 'prismjs';

export type Token = {
  types: string[];
  content: string;
  empty?: boolean;
};

const newlineRe = /\r\n|\r|\n/;

// Empty lines need to contain a single empty token, denoted with { empty: true }
const normalizeEmptyLines = (line: Token[]) => {
  if (line.length === 0) {
    line.push({
      types: ['plain'],
      content: '\n',
      empty: true,
    });
  } else if (line.length === 1 && line[0].content === '') {
    line[0].content = '\n';
    line[0].empty = true;
  }
};

const appendTypes = (types: string[], add: string[] | string): string[] => {
  const typesSize = types.length;

  if (typesSize > 0 && types[typesSize - 1] === add) {
    return types;
  }

  return types.concat(add);
};

// Takes an array of Prism's tokens and groups them by line, turning plain
// strings into tokens as well. Tokens can become recursive in some cases,
// which means that their types are concatenated. Plain-string tokens however
// are always of type "plain".
// This is not recursive to avoid exceeding the call-stack limit, since it's unclear
// how nested Prism's tokens can become
const normalizeTokens = (tokens: (PrismToken | string)[]): Token[][] => {
  const typeArrStack: string[][] = [[]];
  const tokenArrStack = [tokens];
  const tokenArrIndexStack = [0];
  const tokenArrSizeStack = [tokens.length];
  let i = 0;
  let stackIndex = 0;
  let currentLine: Token[] = [];
  const acc = [currentLine];

  while (stackIndex > -1) {
    while (
      // eslint-disable-next-line no-cond-assign, no-plusplus
      (i = tokenArrIndexStack[stackIndex]++) < tokenArrSizeStack[stackIndex]
    ) {
      let content: TokenStream;
      let types = typeArrStack[stackIndex];
      const tokenArr = tokenArrStack[stackIndex];
      const token = tokenArr[i];

      // Determine content and append type to types if necessary
      if (typeof token === 'string') {
        types = stackIndex > 0 ? types : ['plain'];
        content = token;
      } else {
        types = appendTypes(types, token.type);

        if (token.alias) {
          types = appendTypes(types, token.alias);
        }

        content = token.content;
      }

      // If token.content is an array, increase the stack depth and repeat this while-loop
      if (typeof content !== 'string') {
        stackIndex += 1;
        typeArrStack.push(types);
        tokenArrStack.push(content as PrismToken[]);
        tokenArrIndexStack.push(0);
        tokenArrSizeStack.push(content.length);
        // eslint-disable-next-line no-continue
        continue;
      }

      // Split by newlines
      const splitByNewlines = content.split(newlineRe);
      const newlineCount = splitByNewlines.length;
      currentLine.push({
        types,
        content: splitByNewlines[0],
      });

      // Create a new line for each string on a new line
      for (let j = 1; j < newlineCount; j += 1) {
        normalizeEmptyLines(currentLine);
        acc.push((currentLine = []));
        currentLine.push({
          types,
          content: splitByNewlines[j],
        });
      }
    }

    // Decreate the stack depth
    stackIndex -= 1;
    typeArrStack.pop();
    tokenArrStack.pop();
    tokenArrIndexStack.pop();
    tokenArrSizeStack.pop();
  }

  normalizeEmptyLines(currentLine);
  return acc;
};

export default normalizeTokens;
