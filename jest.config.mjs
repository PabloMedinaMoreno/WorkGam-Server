// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    // Esto ayuda a resolver imports internos sin necesidad de incluir la extensión .js
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
