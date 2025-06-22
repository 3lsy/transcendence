FROM hashicorp/vault:1.19

COPY ./certs/ /vault/certs/

RUN chown -R vault:vault /vault/certs && chmod 644 /vault/certs/*

CMD ["vault", "server", "-config=/vault/config/config.hcl"]

# openssl req -x509 -newkey rsa:4096 -nodes -keyout vault.key -out vault.crt -days 365 -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=42/CN=vault.local"