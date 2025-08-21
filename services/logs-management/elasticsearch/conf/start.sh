#!/bin/bash

# Start Elasticsearch in the background
/usr/share/elasticsearch/bin/elasticsearch &

# Wait for Elasticsearch to be ready (simple loop with curl)
echo "Waiting for Elasticsearch to start..."
until curl -s -k https://localhost:9200 >/dev/null; do
  sleep 1
done

# Set Vault environment variables
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
vault_cert_login "/etc/elasticsearch/elasticsearch.crt" "/etc/elasticsearch/elasticsearch.key"

# Check if the first time setup has been done
if [ ! -f /usr/share/elasticsearch/data/elasticsearch.setup ]; then
  # Create the first time setup file
  touch /usr/share/elasticsearch/data/elasticsearch.setup

  # Reset Elasticsearch password non-interactively
  ELASTIC_PASSWORD=$(/usr/share/elasticsearch/bin/elasticsearch-reset-password --username elastic --auto --batch --silent)

  # Store the Elasticsearch user password in Vault
  echo "Storing Elasticsearch admin password in Vault..."
  until vault kv put secret/elasticsearch elastic_password="$ELASTIC_PASSWORD"; do
    echo "Failed to store password in Vault... waiting..."
    sleep 2
  done

  # Kibana service user token
  KIBANA_TOKEN=$(/usr/share/elasticsearch/bin/elasticsearch-service-tokens create elastic/kibana kibana-token | awk -F' = ' '{print $2}')

  # Store the Kibana service user token in Vault
  echo "Storing Kibana service user token in Vault..."
  until vault kv put secret/kibana kibana_service_token="$KIBANA_TOKEN"; do
    echo "Failed to store Kibana service token in Vault... waiting..."
    sleep 2
  done

  cp -v /etc/elasticsearch/service_tokens /usr/share/elasticsearch/data/service_tokens

else
  echo "Elasticsearch setup file already exists. Skipping first time setup."
  
  cp -v /usr/share/elasticsearch/data/service_tokens /etc/elasticsearch/service_tokens

fi

# Bring Elasticsearch back to foreground
wait
