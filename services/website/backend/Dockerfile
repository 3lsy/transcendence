FROM node:24-alpine
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

CMD ["npm", "start"]
