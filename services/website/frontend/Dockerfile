FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build && mkdir -p /app/build && cp -r dist index.html locales favicon.ico build

FROM nginx:1.29

COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf