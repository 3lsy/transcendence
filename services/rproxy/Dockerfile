FROM rockylinux/rockylinux:9.6

# Environment
ENV TZ=UTC

# Install Apache and required modules
RUN dnf -y update && \
    dnf -y install httpd mod_ssl mod_security wget && \
    dnf clean all

# Add GPG key for Filebeat
COPY conf/elastic.repo /etc/yum.repos.d/elastic.repo
COPY conf/filebeat.yml /etc/filebeat/filebeat.yml
# Install Filebeat
RUN rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch
RUN dnf install -y --enablerepo=elastic filebeat && \
    dnf clean all

# openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout rproxy.key -out rproxy.crt -config rproxy_openssl.cnf -extensions v3_req
COPY certs/ /etc/pki/tls/certs/

# Set permissions on private keys
RUN chmod 600 /etc/pki/tls/certs/*.key && \
    chown root:root /etc/pki/tls/certs/*

RUN rm -f /etc/httpd/conf.d/ssl.conf

# There ends the reverse proxy with SSL configuration. Next is the WAF/ModSecurity configuration.

RUN cd /etc/httpd/conf/ && \
    wget https://github.com/coreruleset/coreruleset/archive/refs/tags/v4.16.0.tar.gz && \
    tar xzvf v4.16.0.tar.gz && \
    ln -s coreruleset-4.16.0/ /etc/httpd/conf/crs && \
    rm -f v4.16.0.tar.gz && \
    cp crs/crs-setup.conf.example crs/crs-setup.conf

COPY conf/mod_security.conf /etc/httpd/conf.d/mod_security.conf

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Enable and start Apache
# CMD ["/usr/sbin/httpd", "-DFOREGROUND"]
CMD ["/usr/local/bin/start.sh"]

# Documentation
# https://hostperl.com/kb/tutorials/implementing-a-waf-like-modsecurity-on-apache
# https://docs.rockylinux.org/guides/web/apache_hardened_webserver/modsecurity/