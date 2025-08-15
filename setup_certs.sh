#!/bin/bash

set -euo pipefail

# ===================================
# CONFIGURATION
# ===================================

# Certificate details
COUNTRY="FR"
STATE="Paris"
LOCALITY="Paris"
ORG="42"
ORG_UNIT="42"
DAYS_VALID=365
KEY_SIZE=4096

VAULT_CERTS_DIR="./services/vault/certs"
mkdir -p "$VAULT_CERTS_DIR"

# Services and CNs with their target directories
declare -A services=(
  ["elasticsearch"]="./services/logs-management/elasticsearch/certs"
  ["kibana"]="./services/logs-management/kibana/certs"
  ["logstash"]="./services/logs-management/logstash/certs"
  ["grafana"]="./services/monitoring/grafana/certs"
  ["rproxy"]="./services/rproxy/certs"
  ["vault"]="./services/vault/certs"
)

# Certs to copy to Vault
declare -A vault_certs=(
  ["elasticsearch"]="./services/logs-management/elasticsearch/certs/elasticsearch.crt"
  ["kibana"]="./services/logs-management/kibana/certs/kibana.crt"
  ["logstash"]="./services/logs-management/logstash/certs/logstash.crt"
  ["grafana"]="./services/monitoring/grafana/certs/grafana.crt"
)

# ===================================
# FUNCTIONS
# ===================================

generate_cert() {
  local service_name="$1"
  local target_dir="$2"
  local cn="${service_name}.localhost"

  echo "Generating cert for $service_name in $target_dir..."
  mkdir -p "$target_dir"
  rm -rf "$target_dir/$service_name.key" "$target_dir/$service_name.crt"

  openssl req -x509 -newkey rsa:${KEY_SIZE} -nodes \
    -keyout "$target_dir/$service_name.key" \
    -out "$target_dir/$service_name.crt" \
    -days "$DAYS_VALID" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORG/OU=$ORG_UNIT/CN=$cn"
}

generate_all() {
  for service in "${!services[@]}"; do
    generate_cert "$service" "${services[$service]}"
  done
}

copy_certs() {
    # Copy .crt to ./services/vault/certs
    local source_crt="$1"

    cp "$source_crt" "$VAULT_CERTS_DIR/"
    echo "Copied $(basename "$source_crt") to $VAULT_CERTS_DIR"
}

# ===================================
# MAIN SCRIPT
# ===================================

generate_all
for service in "${!vault_certs[@]}"; do
    copy_certs "${vault_certs[$service]}"
done
echo "✅ All certificates and keys generated successfully."
