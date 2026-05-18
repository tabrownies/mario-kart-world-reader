# Getting Started

## Prerequisites

To work on this repository, you will need to have installed:

- [Node.js](https://nodejs.org/en) (v20+ recommended). We highly recommend using
  **[nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)** as the golden path for managing
  Node versions.
- [Python](https://www.python.org/downloads/) (v3.10+ recommended). We highly recommend using
  Python's built-in **`venv`** module for managing virtual environments.
- `protoc` (Protocol Buffers compiler). On macOS, you can install this via `brew install protobuf`.

## Installation

1. **Clone the repository:**

   ```bash
   git clone git@github.com:tabrownies/mario-kart-world-reader.git
   cd mariokartWorldScreenReader
   ```

2. **Set up Python Environment:** Create a virtual environment (`venv`) and install necessary
   protobuf tools:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install grpcio grpcio-tools protobuf
   ```

3. **Set up TypeScript Environment:** Ensure you are on the correct Node version using `nvm` (if
   installed), then navigate to the TypeScript types package and install dependencies:

   ```bash
   nvm use 20  # (optional, if using nvm)
   cd packages/types/typescript
   npm install
   cd ../../..
   ```

4. **Compile Protocol Buffers:** We use Protobufs to maintain type consistency between Python and
   TypeScript. You must compile the `.proto` file into Python and TypeScript files using the
   provided script:
   ```bash
   ./build_types.sh
   ```

## Formatting and Linting

This repository enforces consistent formatting. All formatting configuration files are located
inside the `packages/formatters/` directory to keep the root directory clean. You can run these
formatters locally from the root of the project to fix your code before pushing:

- **TypeScript / Markdown / JSON (Prettier):**
  `npx prettier --write "**/*.{ts,js,json,md}" --config packages/formatters/.prettierrc`
- **Python (Ruff):** `ruff format --config packages/formatters/pyproject.toml .` and
  `ruff check --config packages/formatters/pyproject.toml --fix .`
- **Protobuf (Clang-Format):**
  `clang-format -i --style=file:packages/formatters/.clang-format packages/types/data.proto`
