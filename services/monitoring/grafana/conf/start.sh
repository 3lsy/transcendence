#!/bin/bash

export VAULT_ADDR=https://vault:8200
export VAULT_SKIP_VERIFY=true              # Self-signed certificates require this
export HOME=/tmp

# Wait for Vault to be unsealed
echo "Waiting for Vault to be unsealed..."
until curl -s --insecure "$VAULT_ADDR/v1/sys/seal-status" | jq -e '.sealed == false' > /dev/null; do
  echo "Vault is still sealed... waiting 2 seconds"
  sleep 2
done
echo "Vault is unsealed."

# Login to Vault using the client certificate
echo "Waiting for Vault cert-auth to be ready..."
until VAULT_TOKEN=$(vault login -method=cert \
    -client-cert=/etc/grafana/certs/grafana.crt \
    -client-key=/etc/grafana/certs/grafana.key \
    -format=json | jq -r .auth.client_token); do
  echo "Vault login failed (permission denied)... waiting..."
  sleep 2
done

RAND=$(openssl rand -hex 16)

# Store the Grafana admin password in Vault
echo "Storing Grafana admin password in Vault..."
until vault kv put secret/grafana admin_password="$RAND"; do
  echo "Failed to store password in Vault... waiting..."
  sleep 2
done

export GF_SECURITY_ADMIN_PASSWORD="$RAND"

# Start Grafana
/usr/sbin/grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini