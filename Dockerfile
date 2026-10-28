FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=base /app/src ./src
COPY --from=base /app/migrations ./migrations

EXPOSE 3000

CMD ["node", "src/app.js"]
