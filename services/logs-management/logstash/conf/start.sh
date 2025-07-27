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

  export VAULT_TOKEN=$(vault token lookup | jq -r .data.id)
  echo "Vault login successful. Token: $VAULT_TOKEN"
}

# --- MAIN ---

wait_for_vault_ready
vault_cert_login "/etc/logstash/logstash.crt" "/etc/logstash/logstash.key"

# Get the Elastic password from Vault
until ELASTIC_PASSWORD=$(vault kv get -field=elastic_password secret/elasticsearch); do
  echo "Failed to retrieve Logstash service token from Vault... waiting..."
  sleep 2
done

## Logstash KEYSTORE
# Keystore password
export LOGSTASH_KEYSTORE_PASS="$(openssl rand -base64 32)"

# Store keystore password in vault
echo "Storing Logstash keystore password in Vault..."
until vault kv put secret/logstash logstash_keystore_password="$LOGSTASH_KEYSTORE_PASS"; do
  echo "Failed to store Logstash keystore password in Vault... waiting..."
  sleep 2
done

# Create Logstash keystore if it doesn't exist
if [ ! -f /usr/share/logstash/config/logstash.keystore ]; then
  echo "Creating Logstash keystore..."
  /usr/share/logstash/bin/logstash-keystore create
fi

# Add Logstash password to the keystore
echo "Adding Logstash password to the keystore..."
/usr/share/logstash/bin/logstash-keystore add ELASTIC_PASSWORD <<< "$ELASTIC_PASSWORD"

/usr/share/logstash/bin/logstash