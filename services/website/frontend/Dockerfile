FROM rockylinux/rockylinux:9.5-minimal

# Install dependencies
RUN microdnf install -y dnf && \
    dnf -y update && \
    dnf clean all

# Create a non-root user
RUN useradd -u 1000 -m -s /bin/bash ponguser
USER ponguser
WORKDIR /home/ponguser

CMD ["/bin/bash"]
