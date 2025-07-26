# elasticsearch-policy.hcl
path "secret/data/elasticsearch" {
  capabilities = ["read", "create", "update"]
}
