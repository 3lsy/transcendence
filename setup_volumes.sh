#!/bin/bash

# This script is to setup the volume directories for the Docker containers

# vault-data : uid=999(vault) gid=999(vault) groups=999(vault)
# grafana-data : uid=998(grafana) gid=998(grafana) groups=998(grafana)
# prometheus-data : uid=1000(prometheus) gid=1000(prometheus) groups=1000(prometheus)
# elasticsearch-data : uid=999(elasticsearch) gid=999(elasticsearch) groups=999(elasticsearch)
# kibana-data : uid=999(kibana) gid=999(kibana) groups=999(kibana)
# logstash-data : uid=999(logstash) gid=999(logstash) groups=999(logstash)

declare -A volumes=(
    [vault-data]="999:999"
    [grafana-data]="998:998"
    [prometheus-data]="1000:1000"
    [elasticsearch-data]="999:999"
    [kibana-data]="999:999"
    [logstash-data]="999:999"
    [logstash-config]="999:999"
    [scoreboard-data]="999:999"
)

DATA_DIR="/home/vagrant/data"

mkdir -p "$DATA_DIR"

create_volume() {
    local dir=$1
    local uid_gid=$2

    mkdir -p "$DATA_DIR/$dir"
    sudo chown $uid_gid "$DATA_DIR/$dir"
    sudo chmod 700 "$DATA_DIR/$dir"
}

for volume in "${!volumes[@]}"; do
    create_volume "$volume" "${volumes[$volume]}"
done
