FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Salin node_modules hasil tahap base apa adanya. Install ulang dengan --omit=dev
# membuat node-pg-migrate hilang, padahal perintah start butuh paket itu untuk migrasi.
COPY package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY --from=base /app/migrations ./migrations

EXPOSE 3000

CMD ["node", "src/app.js"]
