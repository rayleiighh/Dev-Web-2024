// jest.config.test.js
module.exports = {
  verbose: true,                       // Affiche chaque test dans la console
  testMatch: ["**/tests/**/*.test.js"],// Où Jest cherche vos tests

  collectCoverage: true,               // Active la génération de coverage
  coverageDirectory: "tests/coverage", // Dossier de sortie
  coverageReporters: [
    "text",    // résumé dans la console
    "lcov",    // rapport HTML + LCOV
    "html"
  ],

  // Quels fichiers doivent être soumis à la couverture
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "middleware/**/*.js",
    "jobs/**/*.js",
    "models/**/*.js",
    "!models/**/*.test.js",  // exclut d’éventuels tests placés à côté des modèles
    "!**/tests/**",          // on n’instrumente pas nos tests
    "!**/node_modules/**"
  ],

  coverageThreshold: {                 // seuils min. de couverture
    global: {
      branches:   80,
      functions:  80,
      lines:      80,
      statements: 80
    },
    // On peut aussi fixer des seuils spécifiques aux dossiers
    "jobs/":       { statements: 50 },
    "middleware/": { statements: 70 },
  },

  setupFilesAfterEnv: ["<rootDir>/tests/setupTeardown.js"] // si tu as un fichier de setup/global teardown
};
