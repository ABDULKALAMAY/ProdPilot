FROM node:22-alpine
WORKDIR /app
RUN npm install --global pnpm@11.19.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
RUN pnpm install --frozen-lockfile --filter prodpilot-server... --prod
COPY server/src ./server/src
WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
