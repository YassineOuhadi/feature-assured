# Architecture Diagrams

This folder contains diagrams that illustrate the structure and runtime flow of the extension.

### 1. High-Level Design (HLD)
- **File:** [extension-hld.mmd](extension-hld.mmd)  
- **Purpose:** Non-technical overview showing how Feature Assured, the Cypress Generic library, Docker images (dev & runner), DevContainer and CI interact.

### 2. Low-Level Design (LLD)
- **File:** [extension-lld.mmd](extension-lld.mmd)    
- **Purpose:** Implementation-level view mapping extension modules to source files (src/*), watchers, CodeLens providers and runners.

### 3. Sequence Diagram
- **File:** [extension-sequence.mmd](extension-sequence.mmd)  
- **Purpose:** Step-by-step runtime flow for "Run Feature": CodeLens → run command → runner/terminal → report generation → diagnostics / inline results.