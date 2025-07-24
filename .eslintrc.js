module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  parserOptions: {
    project: 'tsconfig.json',
  },
  rules: {
    'import/extensions': 0,
    'import/no-cycle': 0,
    'import/no-named-as-default': 0,
    'object-curly-newline': 0,
    'arrow-parens': 1,
    'no-loop-func': 1,
    'operator-linebreak': 0,
    'comma-dangle': 0,
    'max-len': 0,
    'no-use-before-define': 0,
    'no-extra-semi': 0,
    'no-param-reassign': 1,
    'no-mixed-operators': 1,
    'no-async-promise-executor': 0,
    'no-underscore-dangle': 0,
    'consistent-return': 0,
    'class-methods-use-this': 1,
    'prefer-promise-reject-errors': 0,
    'prefer-destructuring': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/media-has-caption': 0,
    'react/prop-types': 0,
    'react/state-in-constructor': 0,
    'react/require-default-props': 0,
    'react/destructuring-assignment': 0,
    'react/jsx-props-no-spreading': 0,
    'react/jsx-filename-extension': [
      1,
      {
        extensions: ['.jsx', '.tsx'],
      }
    ],
    'react/jsx-one-expression-per-line': [
      1,
      {
        allow: 'single-child',
      }
    ],
    'react/button-has-type': 0,
    'react/sort-comp': 0,
    'react/no-did-update-set-state': 0,
    'react/static-property-placement': 0,
    'react-hooks/exhaustive-deps': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-extra-semi': 0,
    '@typescript-eslint/semi': 1,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/naming-convention': 1,
  },
  globals: {
    document: true,
    localStorage: true,
    window: true,
  }
};
