FROM rockylinux/rockylinux:9.6

ENV PROMETHEUS_VERSION=3.4.2

# Dependencies
RUN dnf update -y && \
    dnf install -y wget tar && \
    dnf clean all

# Prometheus user and directories
RUN useradd --no-create-home --shell /usr/sbin/nologin prometheus && \
    mkdir /etc/prometheus /prometheus && \
    chown prometheus:prometheus /etc/prometheus /prometheus

# Download and install Prometheus
# https://prometheus.io/download/
RUN cd /tmp && \
    wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz && \
    tar xzf prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz && \
    cd prometheus-${PROMETHEUS_VERSION}.linux-amd64 && \
    mv prometheus promtool /usr/local/bin/ && \
    chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool && \
    chown -R prometheus:prometheus /etc/prometheus && \
    rm -rf /tmp/prometheus-${PROMETHEUS_VERSION}.linux-amd64*

# Use the Prometheus user
USER prometheus

# Run Prometheus
ENTRYPOINT ["/usr/local/bin/prometheus"]
CMD ["--config.file=/etc/prometheus/prometheus.yml","--storage.tsdb.path=/prometheus"]