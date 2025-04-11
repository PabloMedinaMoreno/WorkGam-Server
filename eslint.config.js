// eslint.config.js
export default {
  // Files and directories to ignore (using glob patterns)
  ignores: ['node_modules/**', 'dist/**', 'build/**'],

  languageOptions: {
    parserOptions: {
      ecmaVersion: 'latest', // e.g. 2022 or "latest" works
      sourceType: 'module', // Using ES modules; change to "script" if you prefer CommonJS
    },
    // Define globals that are available in a Node.js environment
    globals: {
      __dirname: 'readonly',
      __filename: 'readonly',
      console: 'readonly',
      exports: 'writable',
      module: 'writable',
      process: 'readonly',
      require: 'readonly',
    },
  },

  // Base rules applied throughout the project
  rules: {
    // Enforce semicolons at the end of statements
    semi: ['error', 'always'],
    // Enforce single quotes for strings (allow escape)
    quotes: ['error', 'single', { avoidEscape: true }],
    // Warn when using console (optional in Node apps)
    'no-console': 'off', // or "warn" if you still want a warning
    // Enforce strict equality comparisons
    eqeqeq: 'error',
    // Always use curly braces for blocks
    curly: 'error',
    // Enforce consistent 2-space indentation
    indent: ['error', 2],
    // Enforce Unix linebreak style (LF)
    'linebreak-style': ['error', 'unix'],
    // Disallow trailing whitespace at the end of lines
    'no-trailing-spaces': 'error',
    // Warn for unused variables (ignore those prefixed with _)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Disallow multiple spaces except for alignment
    'no-multi-spaces': 'error',
    // Require trailing commas in multiline object or array literals
    'comma-dangle': ['error', 'always-multiline'],
    // Enforce consistent spacing inside curly braces
    'object-curly-spacing': ['error', 'always'],
    // Disallow spaces inside array brackets
    'array-bracket-spacing': ['error', 'never'],
  },
};

//   npx eslint fichero
