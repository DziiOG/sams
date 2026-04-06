FROM node:22-alpine

RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY services ./services
COPY tests ./tests
COPY docs ./docs
COPY prisma ./prisma
COPY README.md CHANGELOG.md .env.example .editorconfig ./

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "test"]
