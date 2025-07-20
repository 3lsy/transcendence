FROM rockylinux/rockylinux:9.6

RUN dnf -y update \
    && dnf -y install dnf-plugins-core \
    && dnf config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo \
    && dnf -y install vault \
    && dnf clean all

COPY ./certs/ /vault/certs/

RUN chown -R vault:vault /vault/certs /usr/bin/vault \
    && chmod 644 /vault/certs/*

USER vault
CMD ["vault", "server", "-config=/vault/config/config.hcl"]

# openssl req -x509 -newkey rsa:4096 -nodes -keyout vault.key -out vault.crt -days 365 -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=42/CN=vault.localhost"