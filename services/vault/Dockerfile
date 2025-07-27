FROM rockylinux/rockylinux:9.6

RUN dnf -y update \
    && dnf -y install dnf-plugins-core jq \
    && dnf config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo \
    && dnf -y install vault \
    && dnf clean all

COPY ./certs/ /vault/certs/

RUN mkdir -p /vault/policies

COPY conf/grafana-policy.hcl /vault/policies/grafana-policy.hcl
COPY conf/elastic-policy.hcl /vault/policies/elastic-policy.hcl

RUN chown -R vault:vault /vault/ /usr/bin/vault \
    && chmod 644 /vault/certs/*

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

USER vault

CMD ["/usr/local/bin/start.sh"]

# openssl req -x509 -newkey rsa:4096 -nodes -keyout vault.key -out vault.crt -days 365 -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=42/CN=vault.localhost"