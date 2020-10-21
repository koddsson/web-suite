module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error'
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    es6: true
  },
  overrides: [
    {
      files: ['__mocks__/**/*.js', '*.test.js'],
      env: {
        jest: 'true'
      },
      rules: {}
    },
    {
      files: ['public/**/*.js'],
      env: {
        browser: true,
        es6: true
      },
      rules: {}
    }
  ]
}
