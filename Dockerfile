FROM cypress/included:15.4.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    xauth \
    libgtk2.0-0 \
    libdrm2 \
    libgbm-dev \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libxrender1 \
    libxss1 \
    libxrandr2 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxdamage1 \
    libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g cypress @yassinouhadi/cypress-generic-package@1.0.9

ARG MODE=dev
ARG PROJECT_NAME=feature-assured

ENV PROJECT_NAME=$PROJECT_NAME
ENV NODE_PATH=/usr/local/lib/node_modules
ENV PATH=$NODE_PATH/.bin:$PATH

WORKDIR /workspace

RUN if [ "$MODE" = "runner" ]; then \
      echo "🏗️ Initializing Feature Assured project in workspace..."; \
      npm init -y && \
      npx feature-assured init --yes --name "$PROJECT_NAME" --node-path "$NODE_PATH"; \
    else \
      echo "🛠️ Dev mode — no project init."; \
    fi

CMD ["bash"]
