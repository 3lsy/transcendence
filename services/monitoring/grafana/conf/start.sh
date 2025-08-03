#!/bin/bash

export VAULT_ADDR=https://vault:8200
export VAULT_SKIP_VERIFY=true              # Self-signed certificates require this
export HOME=/tmp

wait_for_vault_ready()
{
  # Wait for Vault to be unsealed

  echo "Waiting for Vault to be unsealed..."
  until curl -s --insecure "$VAULT_ADDR/v1/sys/seal-status" | jq -e '.sealed == false' > /dev/null; do
    echo "Vault is still sealed... waiting 2 seconds"
    sleep 2
  done
  echo "Vault is unsealed."

  echo "Waiting for Vault to be ready..."
  until curl -s --insecure --fail "$VAULT_ADDR/v1/sys/health" | jq -e '.initialized == true and .sealed == false' > /dev/null; do
    echo "Vault not ready... waiting 2 seconds"
    sleep 2
  done
  echo "Vault is responding."
}

vault_cert_login()
{
  # Login to Vault using the client certificate

  local cert_path="$1"
  local key_path="$2"

  echo "Waiting for Vault cert-auth to be ready..."
  until vault login -method=cert \
      -client-cert="$cert_path" \
      -client-key="$key_path"; do
    echo "Vault login failed (permission denied)... waiting..."
    sleep 2
  done

  export VAULT_TOKEN=$(vault token lookup -format=json | jq -r .data.id)
  echo "Vault login successful. Token: $VAULT_TOKEN"
}

# --- MAIN ---

wait_for_vault_ready
vault_cert_login "/etc/grafana/certs/grafana.crt" "/etc/grafana/certs/grafana.key"

# If the first time setup file doesn't exist, create it
if [ ! -f /var/lib/grafana/grafana.setup ]; then
  touch /var/lib/grafana/grafana.setup
  echo "Grafana setup file created."

  RAND=$(openssl rand -hex 16)

  # Store the Grafana admin password in Vault
  echo "Storing Grafana admin password in Vault..."
  until vault kv put secret/grafana admin_password="$RAND"; do
    echo "Failed to store password in Vault... waiting..."
    sleep 2
  done

  export GF_SECURITY_ADMIN_PASSWORD="$RAND"

else
  # Retrieve the Grafana admin password from Vault
  until GF_SECURITY_ADMIN_PASSWORD=$(vault kv get -field=admin_password secret/grafana); do
    echo "Failed to retrieve Grafana admin password from Vault... waiting..."
    sleep 2
  done
  echo "Grafana admin password retrieved from Vault."
  export GF_SECURITY_ADMIN_PASSWORD
fi

# Start Grafana
/usr/sbin/grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini