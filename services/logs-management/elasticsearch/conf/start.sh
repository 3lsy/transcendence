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

# Save Elasticsearch password non-interactively
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

# Logstash save logstash_system user password
LOGSTASH_PASSWORD=$(/usr/share/elasticsearch/bin/elasticsearch-reset-password --username logstash_system --auto --silent --batch)

# Store the Logstash user password in Vault
echo "Storing Logstash user password in Vault..."
until vault kv put secret/logstash logstash_password="$LOGSTASH_PASSWORD"; do
  echo "Failed to store Logstash password in Vault... waiting..."
  sleep 2
done

# Bring Elasticsearch back to foreground
wait
