FROM rockylinux/rockylinux:9.6

# Environment
ENV TZ=UTC

# Install Apache and required modules
RUN dnf -y update && \
    dnf -y install httpd mod_ssl && \
    dnf clean all

# openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout rproxy.key -out rproxy.crt -config rproxy_openssl.cnf -extensions v3_req
COPY certs/ /etc/pki/tls/certs/

# Set permissions on private keys
RUN chmod 600 /etc/pki/tls/certs/*.key && \
    chown root:root /etc/pki/tls/certs/*

RUN rm -f /etc/httpd/conf.d/ssl.conf

# Enable and start Apache
CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
