FROM rockylinux/rockylinux:9.6
# https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-elasticsearch-on-rocky-linux-9

# Install required packages
RUN dnf update -y && dnf clean all

# Add GPG key for Elasticsearch
RUN rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch

# Copy custom Elasticsearch repo file
COPY conf/elasticsearch.repo /etc/yum.repos.d/elasticsearch.repo

# Install Elasticsearch
RUN dnf install -y --enablerepo=elasticsearch elasticsearch && \
    dnf clean all

# Copy custom elasticsearch.yml
COPY conf/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml

# Give permission to the Elasticsearch directories
RUN chown -R elasticsearch:elasticsearch /etc/elasticsearch /var/lib/elasticsearch /usr/share/elasticsearch

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Switch to the non-root user
USER elasticsearch

CMD ["/usr/local/bin/start.sh"]
