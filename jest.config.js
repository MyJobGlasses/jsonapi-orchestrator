const { defaults } = require('jest-config');

module.exports = {
  modulePathIgnorePatterns: [...defaults.modulePathIgnorePatterns, '<rootDir>/build'],
}
