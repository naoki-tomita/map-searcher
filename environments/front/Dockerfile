FROM node:19.7.0-alpine3.17 AS builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY front/package.json front/package.json

RUN yarn workspace front install

COPY front/index.html front/
COPY front/index.tsx front/
COPY front/vite.config.ts front/

RUN yarn workspace front vite build

FROM nginx:1.22.1 AS runner
COPY --from=builder /app/front/dist /usr/share/nginx/html
COPY environments/front/nginx.conf /etc/nginx/nginx.conf
