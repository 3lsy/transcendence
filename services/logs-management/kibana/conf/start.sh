#!/bin/bash

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

# wait_for_elasticsearch_ready() {
#   echo "Waiting for Elasticsearch cluster to be ready..."
#   until curl -s -k -u elastic:$ELASTIC_PASSWORD https://elasticsearch:9200/_cluster/health | jq -e '.status == "green" or .status == "yellow"' > /dev/null; do
#     echo "Elasticsearch cluster not ready yet... waiting 5s"
#     sleep 5
#   done
#   echo "Elasticsearch cluster is ready."
# }

# --- MAIN ---

wait_for_vault_ready
vault_cert_login "/etc/kibana/kibana.crt" "/etc/kibana/kibana.key"

# Wait for ES before fetching token (security index must be available)
# wait_for_elasticsearch_ready

# Get the Kibana service user token from Vault
until KIBANA_TOKEN=$(vault kv get -field=kibana_service_token secret/kibana); do
  echo "Failed to retrieve Kibana service token from Vault... waiting..."
  sleep 2
done

# If the flag file for setup don't exist, create it
if [ ! -f /usr/share/kibana/data/kibana.setup ]; then
  touch /usr/share/kibana/data/kibana.setup
  echo "Kibana setup file created."

  # Add token to Kibana configuration
  echo "Storing Kibana service user token in configuration..."

  {
    echo "elasticsearch.serviceAccountToken: \"$KIBANA_TOKEN\""
    echo "xpack.security.encryptionKey: \"$(openssl rand -base64 32)\""
    echo "xpack.encryptedSavedObjects.encryptionKey: \"$(openssl rand -base64 32)\""
    echo "xpack.reporting.encryptionKey: \"$(openssl rand -base64 32)\""
  } | tee -a /etc/kibana/kibana.yml

  echo "Save kibana.yml configuration in volume."
  cp /etc/kibana/kibana.yml /usr/share/kibana/data/kibana.yml
else
  echo "Kibana setup file already exists. Skipping setup."
  echo "Copying existing configuration..."
  cp /usr/share/kibana/data/kibana.yml /etc/kibana/kibana.yml
  sed -i "s|^elasticsearch.serviceAccountToken:.*|elasticsearch.serviceAccountToken: \"$KIBANA_TOKEN\"|" /etc/kibana/kibana.yml
  cp /etc/kibana/kibana.yml /usr/share/kibana/data/kibana.yml
  echo "Kibana configuration copied from volume."
fi

# Start Kibana
/usr/share/kibana/bin/kibana