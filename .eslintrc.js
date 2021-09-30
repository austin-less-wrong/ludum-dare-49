module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],
    'prefer-arrow-callback': ['error', {'allowNamedFunctions': true}],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-body-style': ['error', 'as-needed'],
    'no-var': 'error',
    'prefer-const': ['error', {destructuring: 'all'}],
    'semi': 'error',
    'no-trailing-spaces': 'error',
    'curly': ['error', 'multi-line'],
    'eqeqeq': 'error',
    'no-shadow': 'error',
    'brace-style': 'error',
    'quotes': ['error', 'single', {allowTemplateLiterals: true}],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
