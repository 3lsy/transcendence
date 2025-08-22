FROM rockylinux/rockylinux:9.6

RUN dnf update -y && dnf clean all

RUN rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch

COPY conf/kibana.repo /etc/yum.repos.d/kibana.repo

RUN dnf install -y --enablerepo=kibana kibana && \
    dnf clean all

# Install HashiCorp Vault
RUN dnf -y install dnf-plugins-core jq \
    && dnf config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo \
    && dnf -y install vault \
    && dnf clean all

COPY conf/kibana.yml /etc/kibana/kibana.yml
COPY conf/dashboard.ndjson /usr/share/kibana/data/dashboard.ndjson

RUN chown -R kibana:kibana /etc/kibana /usr/share/kibana /usr/bin/vault

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

USER kibana

ENV ES_JAVA_OPTS="-Xms1g -Xmx1g"

CMD ["/usr/local/bin/start.sh"]