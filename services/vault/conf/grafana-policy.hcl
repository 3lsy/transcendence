# grafana-policy.hcl
path "secret/data/grafana" {
  capabilities = ["read", "create", "update"]
}
