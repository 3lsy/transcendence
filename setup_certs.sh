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

# Ownership for each service (UID:GID)
declare -A service_ownership=(
  ["elasticsearch"]="999:999"
  ["kibana"]="999:999"
  ["logstash"]="999:999"
  ["grafana"]="998:998"
  ["vault"]="999:999"
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
  local cn="${service_name}.42.fr"

  echo "Generating cert for $service_name in $target_dir..."
  mkdir -p "$target_dir"
  rm -rf "$target_dir/$service_name.key" "$target_dir/$service_name.crt"

  openssl req -x509 -newkey rsa:${KEY_SIZE} -nodes \
    -keyout "$target_dir/$service_name.key" \
    -out "$target_dir/$service_name.crt" \
    -days "$DAYS_VALID" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORG/OU=$ORG_UNIT/CN=$cn"

  # Set permissions and ownership
  chmod 600 "$target_dir/$service_name.key"
  chmod 644 "$target_dir/$service_name.crt"
  if [[ -n "${service_ownership[$service_name]:-}" ]]; then
    sudo chown "${service_ownership[$service_name]}" "$target_dir/$service_name.key" "$target_dir/$service_name.crt"
  fi
  echo "Generated $service_name.key and $service_name.crt in $target_dir"
}

generate_all() {
  for service in "${!services[@]}"; do
    generate_cert "$service" "${services[$service]}"
  done
}

copy_certs() {
    # Copy .crt to ./services/vault/certs
    local source_crt="$1"

    sudo cp "$source_crt" "$VAULT_CERTS_DIR/"
    echo "Copied $(basename "$source_crt") to $VAULT_CERTS_DIR"

    # Set ownership for the copied cert
    if [[ -n "${service_ownership[$(basename "$source_crt" .crt)]}" ]]; then
        sudo chown "${service_ownership[$(basename "$source_crt" .crt)]}" "$VAULT_CERTS_DIR/$(basename "$source_crt")"
    fi
}

# ===================================
# MAIN SCRIPT
# ===================================

generate_all
for service in "${!vault_certs[@]}"; do
    copy_certs "${vault_certs[$service]}"
done
echo "✅ All certificates and keys generated successfully."
