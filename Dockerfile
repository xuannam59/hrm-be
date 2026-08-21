FROM node:22.18-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn build

FROM node:22.18-alpine AS production

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/main.js"]
