#!/bin/bash

export VAULT_ADDR=https://localhost:8200
export VAULT_SKIP_VERIFY=true              # Self-signed certificates require this

INIT_FILE="/vault/data/init.json"

vault server -config=/vault/config/config.hcl &

# Wait for Vault to be ready
echo "Waiting for Vault to start..."
until curl -s -k "$VAULT_ADDR" >/dev/null; do
  sleep 1
done

# Initialize Vault (if not already initialized)
if vault status | grep -q 'Initialized.*false'; then
  echo "Vault is not initialized. Initializing..."
  vault operator init -key-shares=5 -key-threshold=3 -format=json > "$INIT_FILE"
  echo "Vault initialized. Keys saved to $INIT_FILE."
fi

# Unseal Vault (if not already unsealed)
if vault status | grep -q 'Sealed.*true'; then
  echo "Vault is sealed. Unsealing..."
  if [ ! -f "$INIT_FILE" ]; then
    echo "Error: Initialization file $INIT_FILE not found. Cannot unseal Vault."
    exit 1
  fi
  for key in $(jq -r '.unseal_keys_b64[]' "$INIT_FILE"); do
    vault operator unseal "$key"
  done
  echo "Vault unsealed."
fi

# Echo the root token
if [ -f "$INIT_FILE" ]; then
  ROOT_TOKEN=$(jq -r '.root_token' "$INIT_FILE")
  echo "########################################"
  echo "# Vault root token: $ROOT_TOKEN"
  echo "########################################"
else
  echo "Error: Initialization file $INIT_FILE not found. Cannot retrieve root token."
  exit 1
fi

# Vault non-interactive login
export VAULT_TOKEN="$ROOT_TOKEN"

# Enable the KV secrets engine
vault secrets enable -path=secret kv-v2

## Client Policies
vault policy write grafana-policy /vault/policies/grafana-policy.hcl
vault policy write elasticsearch-policy /vault/policies/elasticsearch-policy.hcl

## Client Cert Authentication Method
vault auth enable cert

## Grafana Client Certificate
vault write auth/cert/certs/grafana-cert \
  display_name="grafana" \
  policies=grafana-policy \
  certificate=@/vault/certs/grafana.crt \
  ttl=24h

## Elasticsearch Client Certificate
vault write auth/cert/certs/elasticsearch-cert \
  display_name="elasticsearch" \
  policies=elasticsearch-policy \
  certificate=@/vault/certs/elasticsearch.crt \
  ttl=24h

wait