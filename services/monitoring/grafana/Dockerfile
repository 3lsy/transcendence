# FROM grafana/grafana:11.6.3

# Use Rocky Linux 9.6 minimal base image
FROM rockylinux/rockylinux:9.6

# Install prerequisites and add Grafana yum repository
# https://grafana.com/docs/grafana/latest/setup-grafana/installation/redhat-rhel-fedora/
RUN dnf install -y wget gnupg && \
    wget -q -O gpg.key https://rpm.grafana.com/gpg.key && rpm --import gpg.key && \
    printf "[grafana]\nname=grafana\nbaseurl=https://rpm.grafana.com\nrepo_gpgcheck=1\nenabled=1\ngpgcheck=1\ngpgkey=https://rpm.grafana.com/gpg.key\nsslverify=1\nsslcacert=/etc/pki/tls/certs/ca-bundle.crt\n" > /etc/yum.repos.d/grafana.repo && \
    dnf install -y grafana && \
    dnf clean all

# Start Grafana server
CMD ["/usr/sbin/grafana-server", "--homepath=/usr/share/grafana", "--config=/etc/grafana/grafana.ini"]
