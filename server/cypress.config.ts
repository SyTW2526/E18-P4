import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // baseUrl is not set so tests can call full URLs or configure via CYPRESS_baseUrl env
    specPattern: "cypress/e2e/**/*.cy.{js,ts}",
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },

  video: false,

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
});
