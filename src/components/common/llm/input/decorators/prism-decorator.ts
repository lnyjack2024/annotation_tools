// decorator class copied from
// https://github.com/facebookarchive/draft-js/blob/main/src/model/decorators/CompositeDraftDecorator.js

import { CompositeDecorator, ContentBlock, ContentState, DraftDecorator } from 'draft-js';
import Prism from 'prismjs';
import { List } from 'immutable';
import Decoration from './Decoration';
import { CODE_BLOCK_TYPE } from '../constants';
import normalizeTokens from '../../../code/normalizeTokens';

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

const DELIMITER = '.';

/**
 * Determine whether we can occupy the specified slice of the decorations
 * array.
 */
function canOccupySlice(
  decorations: (string | null)[],
  start: number,
  end: number,
): boolean {
  for (let ii = start; ii < end; ii += 1) {
    if (decorations[ii] != null) {
      return false;
    }
  }
  return true;
}

/**
 * Splice the specified component into our decoration array at the desired
 * range.
 */
function occupySlice(
  targetArr: (string | null)[],
  start: number,
  end: number,
  componentKey: string,
): void {
  for (let ii = start; ii < end; ii += 1) {
    targetArr[ii] = componentKey;
  }
}

interface ExtendedDraftDecorator extends DraftDecorator {
  strategy: (
    block: ContentBlock,
    callback: (start: number, end: number, props: any) => void,
    contentState: ContentState,
  ) => void;
}

class ExtendedDecorator extends CompositeDecorator {
  _decorators: ExtendedDraftDecorator[] = [];

  _props: Record<string, any> = {};

  constructor(decorators: ExtendedDraftDecorator[]) {
    super(decorators);
    this._decorators = decorators.slice();
    this._props = {};
  }

  getDecorations(block: ContentBlock, contentState: ContentState) {
    const decorations = Array(block.getText().length).fill(null);

    this._decorators.forEach((decorator: ExtendedDraftDecorator, ii: number) => {
      let counter = 0;
      const strategy = decorator.strategy;
      const getDecorationsChecker = (start: number, end: number, props: any) => {
        if (canOccupySlice(decorations, start, end)) {
          const key = ii + DELIMITER + counter + DELIMITER + block.getKey();
          occupySlice(decorations, start, end, key);
          this._props[key] = { ...props };
          counter += 1;
        }
      };
      strategy(block, getDecorationsChecker, contentState);
    });

    return List(decorations);
  }

  getPropsForKey(key: string) {
    const componentKey = parseInt(key.split(DELIMITER)[0], 10);
    return {
      ...this._decorators[componentKey].props,
      ...this._props[key],
    };
  }
}

export default new ExtendedDecorator([{
  strategy: (contentBlock, callback) => {
    if (contentBlock.getType() === CODE_BLOCK_TYPE) {
      const language = contentBlock.getData().get('language');
      if (language) {
        const tokens = Prism.tokenize(contentBlock.getText(), Prism.languages[language]);
        const normalizedTokens = normalizeTokens(tokens);
        for (let i = 0; i < normalizedTokens.length; i += 1) {
          const lineTokens = normalizedTokens[i];

          let start = 0;
          for (let j = 0; j < lineTokens.length; j += 1) {
            const token = lineTokens[j];
            const end = start + token.content.length;
            callback(start, end, {
              types: token.types,
            });
            start = end;
          }
        }
      }
    }
  },
  component: Decoration,
}]);
