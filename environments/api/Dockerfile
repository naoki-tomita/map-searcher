FROM node:19.7.0-alpine3.17
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY api/package.json api/package.json
RUN yarn workspace api install
COPY api/*.ts api/
CMD yarn workspace api start
