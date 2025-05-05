// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  maxWorkers: 1,          // <— fuerza un solo worker
};
