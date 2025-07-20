FROM rockylinux/rockylinux:9.6

# Install prerequisites and add Grafana yum repository
# https://grafana.com/docs/grafana/latest/setup-grafana/installation/redhat-rhel-fedora/
RUN dnf install -y wget gnupg && \
    wget -q -O gpg.key https://rpm.grafana.com/gpg.key && rpm --import gpg.key && \
    printf "[grafana]\nname=grafana\nbaseurl=https://rpm.grafana.com\nrepo_gpgcheck=1\nenabled=1\ngpgcheck=1\ngpgkey=https://rpm.grafana.com/gpg.key\nsslverify=1\nsslcacert=/etc/pki/tls/certs/ca-bundle.crt\n" > /etc/yum.repos.d/grafana.repo && \
    dnf install -y grafana && \
    dnf clean all

RUN dnf -y install dnf-plugins-core jq \
    && dnf config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo \
    && dnf -y install vault \
    && dnf clean all

COPY conf/datasources.yml /usr/share/grafana/conf/provisioning/datasources/datasources.yml
COPY conf/dashboards.yml /usr/share/grafana/conf/provisioning/dashboards/dashboards.yml

RUN chown -R grafana:grafana /etc/grafana /var/lib/grafana /usr/share/grafana /usr/bin/vault

COPY conf/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

USER grafana

# Start Grafana server
CMD ["/usr/local/bin/start.sh"]
