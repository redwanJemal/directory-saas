module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
        message: 'Use $queryRaw with tagged template literals instead of $queryRawUnsafe to prevent SQL injection.',
      },
      {
        selector: "CallExpression[callee.property.name='$executeRawUnsafe']",
        message: 'Use $executeRaw with tagged template literals instead of $executeRawUnsafe to prevent SQL injection.',
      },
    ],
  },
};
