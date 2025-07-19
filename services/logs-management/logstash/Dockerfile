FROM rockylinux/rockylinux:9.6

RUN dnf update -y && dnf clean all

RUN rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch

COPY conf/logstash.repo /etc/yum.repos.d/logstash.repo

RUN dnf install -y --enablerepo=logstash logstash && \
    dnf clean all

COPY conf/logstash.yml /usr/share/logstash/config/logstash.yml
COPY conf/pipelines.yml /usr/share/logstash/config/pipelines.yml

RUN chown -R logstash:logstash /etc/logstash /var/lib/logstash /usr/share/logstash

USER logstash

CMD ["/usr/share/logstash/bin/logstash"]
