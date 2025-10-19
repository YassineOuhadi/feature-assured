# Feature Assured

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/yassine-ouhadi.feature-assured?color=blue)](https://marketplace.visualstudio.com/items?itemName=yassine-ouhadi.feature-assured)
![License](https://img.shields.io/badge/license-MIT-green)
[![Docker Runner](https://img.shields.io/badge/docker-runner-blue)](https://hub.docker.com/r/yassineouhadi/feature-assured/tags?page=1&name=runner)
[![Docker Dev](https://img.shields.io/badge/docker-dev-green)](https://hub.docker.com/r/yassineouhadi/feature-assured/tags?page=1&name=dev)
[![NPM Package](https://img.shields.io/npm/v/@yassinouhadi/cypress-generic-package?color=orange)](https://www.npmjs.com/package/@yassinouhadi/cypress-generic-package)

**Feature Assured** is a Visual Studio Code extension for running and validating Cypress `.feature` files using the [@yassinouhadi/cypress-generic-package](https://www.npmjs.com/package/@yassinouhadi/cypress-generic-package).  

It streamlines the Cucumber + Cypress workflow with **real-time validation**, **inline results**, and a **dynamic step explorer**, all within VS Code.

## Key Features

- **Instant Feature Execution** – Run `.feature` files directly from the editor.  
- **Inline Test Feedback** – See results, errors, and screenshots in real time.  
- **Smart Step Validation** – Validates feature steps against the `cypress-generic-library`.  
- **Interactive Step Explorer** – Browse and reuse all implemented Cucumber steps.  
- **Visual JSON Model Explorer** – Inspect POM objects, REST/SOAP endpoints, and GraphQL models.  
- **Built-In Schema Validation** – Ensures JSON configuration is aligned with Cypress Generic Library schemas.  
- **VS Code Problem Integration** – Surface validation and runtime issues directly in the Problems panel.  
- **Request New Step or Feature** – Submit suggestions for new step implementations or enhancements directly from VS Code, helping the step library grow with user needs.

## How It Works

1. Open a `.feature` file in your workspace.  
2. A **CodeLens** appears above the file to run it instantly.  
3. The extension executes the feature using the **generic implementation** from `@yassinouhadi/cypress-generic-package`.  
4. Results, errors, and screenshots are displayed inline—no setup required.  

---

## Built For

Designed for developers and QA engineers who:  
- Use **Cucumber** syntax for Cypress testing.  
- Want to **centralize test logic** in a reusable generic library.  
- Prefer **visual feedback** in VS Code over terminal outputs.  
- Work with **model-driven automation** and JSON-based POMs.  

## Setup Options

Feature Assured can be used **three ways**:

### 1. With npm

Install dependencies manually in your workspace:  

```bash
npm install -D @yassinouhadi/cypress-generic-package
npx feature-assured init           # Initialize Cypress project
npx feature-assured add-examples   # Add example specs and env files
```

Ensure your workspace contains a Cypress project with:

- **integration/features** for feature files
- **cypress/env** for project registry configuration
- Optionally, use tags like **@project=examples** in feature files to select specific configurations 

Example scenario:
```gherkin
Feature: Rest API testing example

  @project=examples
  Scenario: Validate GET /api returns random user
    Given I am using "RandomUserApi"
    When I send a GET request to "/api"
    Then the response status should be 200
    And the response should contain "results"
```

Reference: [RandomUser REST Feature](https://github.com/YassineOuhadi/cypress-generic-package/blob/main/examples/integration/features/service/randomUser.rest.feature)

---

### 2. With DevContainer & Docker

No npm setup required. Download the DevContainer file, place it in **.devcontainer/** in your project, and open the workspace in VS Code.

The DevContainer (**feature-assured:dev**) provides:

- Preinstalled Cypress and **@yassinouhadi/cypress-generic-package**

- All system dependencies for headless and GUI test runs

- Fully ready-to-use workspace with features, examples, and registry configured automatically

Example DevContainer configuration:

```json
{
  "name": "Feature Assured Dev Container",
  "image": "feature-assured:dev",
  "workspaceFolder": "/workspace",
  "extensions": [
    "ms-azuretools.vscode-docker",
    "ms-vscode.js-debug",
    "dbaeumer.vscode-eslint"
  ],
  "environment": {
    "INTERACTIVE_MODE": "false",
    "CYPRESS_CACHE_FOLDER": "/workspace/.cache/Cypress",
    "DISPLAY": "${localEnv:DISPLAY}"
  },
  "remoteUser": "root"
}
```

---

### 3. CI/CD & Headless Test Execution

Feature Assured can run Cypress **.feature** tests in headless mode, making it ideal for CI/CD pipelines. The Docker runner image allows executing tests consistently across environments without requiring a local Node.js setup.

Run Tests Locally in Headless Mode

```bash
docker run -it --rm \
  -v "$(pwd)/cypress:/workspace/cypress" \
  -v "$(pwd)/cypress/reports:/workspace/cypress/reports" \
  -w /workspace \
  -e CYPRESS_ENV_FILE='cypress/env/examples.json' \
  feature-assured:runner \
  npm run cy:run --spec "cypress/integration/**/*.feature"
```

- **-v "$(pwd)/cypress:/workspace/cypress"** mounts your local Cypress project into the container.

- **-v "$(pwd)/cypress/reports:/workspace/cypress/reports"** saves test reports outside the container.

- **feature-assured:runner** is the Docker image containing all necessary dependencies.

Feature Assured works seamlessly with GitHub Actions to run tests automatically on push or pull requests:

```yaml
- name: Run Cypress tests
  run: |
    docker run --rm \
      -v "${{ github.workspace }}/cypress:/workspace/cypress" \
      -v "${{ github.workspace }}/cypress/reports:/workspace/cypress/reports" \
      -w /workspace \
      feature-assured:runner \
      npx cypress run --spec "cypress/e2e/features/**/*.feature"
```

For the full workflow configuration, see: **[.github/workflows/test.yml](.github/workflows/test.yml)**

---

## Developer Tools

- VS Code integration with live schema validation
- Isolated DevContainer for local development
- AJV-based JSON validation engine
- Real-time diagnostics for .feature files and JSON POM definitions

## Related Project

**[Cypress Generic Package](https://github.com/YassineOuhadi/cypress-generic-package)** – The core library powering this extension, providing feature execution, validation, and model management.  

## License

MIT © [Yassine Ouhadi](https://github.com/YassineOuhadi)