# Build the React application into static files.
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.19.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/package.json
RUN pnpm install --frozen-lockfile --filter prodpilot-client...
COPY client ./client
WORKDIR /app/client
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# Nginx is a small, production-ready web server for those static files.
FROM nginx:1.27-alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
