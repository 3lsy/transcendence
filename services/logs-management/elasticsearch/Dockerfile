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

# Install HashiCorp Vault
RUN dnf -y install dnf-plugins-core jq \
    && dnf config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo \
    && dnf -y install vault \
    && dnf clean all

# Copy custom elasticsearch.yml
COPY conf/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml

# Give permission to the Elasticsearch directories
RUN chown -R elasticsearch:elasticsearch /etc/elasticsearch /var/lib/elasticsearch /usr/share/elasticsearch /usr/bin/vault

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Switch to the non-root user
USER elasticsearch

ENV ES_JAVA_OPTS="-Xms1g -Xmx1g"

CMD ["/usr/local/bin/start.sh"]
