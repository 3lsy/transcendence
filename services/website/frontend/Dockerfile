FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Run the preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
