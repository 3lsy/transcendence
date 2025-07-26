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
    -client-cert=/etc/elasticsearch/elasticsearch.crt \
    -client-key=/etc/elasticsearch/elasticsearch.key \
    -format=json | jq -r .auth.client_token); do
  echo "Vault login failed (permission denied)... waiting..."
  sleep 2
done

# Reset Elasticsearch password non-interactively
output=$(/usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic --batch)

# Extract Elasticsearch password
ELASTIC_PASSWORD=$(echo "$output" | grep 'New value' | awk -F': ' '{print $2}')

# Store the Elasticsearch user password in Vault
echo "Storing Elasticsearch admin password in Vault..."
until vault kv put secret/elasticsearch elastic_password="$ELASTIC_PASSWORD"; do
  echo "Failed to store password in Vault... waiting..."
  sleep 2
done

# Kibana Token
# /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token --scope kibana

# Kibana service user token
/usr/share/elasticsearch/bin/elasticsearch-service-tokens create elastic/kibana kibana-token
#SERVICE_TOKEN elastic/kibana/kibana-token = AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYS10b2tlbjpMY2pkeWxPeVJjV1FUeHVwQmhFNkxR

# Bring Elasticsearch back to foreground (optional: tail logs)
wait
