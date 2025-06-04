FROM rockylinux/rockylinux:9.5-minimal

# Install dependencies
RUN microdnf install -y dnf && \
    dnf -y install nodejs npm && \
    dnf clean all

# Set the working directory inside the container
WORKDIR /app

# Install global dependencies
RUN npm install -g http-server typescript

# Copy package.json and package-lock.json first for efficient caching
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the files
COPY . ./

# Compile TypeScript
RUN npx tsc --outDir dist

# Ensure HTML is in `dist/`
RUN mkdir -p dist && cp src/index.html dist/index.html

# Expose port 8080
EXPOSE 8080

# Start the static server to serve files in dist/
CMD ["http-server", "dist", "-p", "8080", "."]



# # Install required packages
# RUN dnf install -y \
#     nginx openssl php-fpm && \
#     dnf clean all

# # Generate SSL certificate
# RUN mkdir -p /etc/nginx/ssl && \
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
#     -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=42/CN=echavez-.42.fr"

# # Copy Nginx configuration
# #COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

# # Ensure necessary directories exist
# RUN mkdir -p /run/php /var/www/html && \
#     systemctl enable php-fpm

# # Create a non-root user
# RUN useradd -u 1000 -m -s /bin/bash ponguser
# USER ponguser
# WORKDIR /home/ponguser

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]
