FROM rockylinux/rockylinux:9.6

RUN dnf update -y && dnf clean all

RUN rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch

COPY conf/kibana.repo /etc/yum.repos.d/kibana.repo

RUN dnf install -y --enablerepo=kibana kibana && \
    dnf clean all

COPY conf/kibana.yml /etc/kibana/kibana.yml

RUN chown -R kibana:kibana /etc/kibana /usr/share/kibana

USER kibana

ENV ES_JAVA_OPTS="-Xms1g -Xmx1g"

CMD ["/usr/share/kibana/bin/kibana"]