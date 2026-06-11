## AGENTS.md

This file provides guidance for agents operating within this repository to ensure efficient and accurate task execution.

### General Workflow

1.  **Investigate**: Always start by understanding the project structure and identifying key files. Prioritize investigating:
    *   `README*` files, root manifests, workspace configuration, and lockfiles.
    *   Build, test, lint, formatting, type-checking, and code generation configurations.
    *   CI workflows and pre-commit or task runner configurations.
    *   Existing instruction files (e.g., `AGENTS.md`, `.cursor/rules/`).
    *   Repository-local configuration files (e.g., `opencode.json`).
2.  **Extract High-Signal Facts**: Focus on finding concrete information such as:
    *   Exact developer commands and their correct usage.
    *   Methods for running isolated tests, packages, or verification steps.
    *   Required command order dependencies (e.g., linting before type-checking).
    *   Monorepo or multi-package boundaries and entry points.
    *   Quirks of the framework or toolchain (e.g., generated code, migrations, build artifacts, special environment loading, dev server specifics).
    *   Repository-specific style or workflow conventions that deviate from defaults.
    *   Testing idiosyncrasies (e.g., fixtures, prerequisites, snapshot workflows).
3.  **Verify**: Prefer executable sources of truth (like configuration files and scripts) over documentation. If there's a conflict, trust the executable source and discard uncertain information.

### Key Information and Conventions

*   **N/A**: Currently, there are no repository-specific developer commands, testing procedures, or workflow conventions that significantly differ from standard practices and require special mention here. Agents should rely on the general investigation steps.

### Questions

*   If crucial information is missing after thorough investigation, use the `question` tool to ask the user specific, targeted questions. Avoid asking about easily discoverable information.

### Writing Rules for this File

*   Include only high-signal, repository-specific guidance.
*   Prefer short sections and bullet points.
*   Omit generic software advice or extensive file listings.
*   If the repository is complex, summarize structural facts that impact agent behavior.
*   In case of doubt, omit the information.
