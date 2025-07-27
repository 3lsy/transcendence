# elastic-policy.hcl
path "secret/data/elasticsearch" {
  capabilities = ["read", "create", "update"]
}
path "secret/data/kibana" {
  capabilities = ["read", "create", "update"]
}
path "secret/data/logstash" {
  capabilities = ["read", "create", "update"]
}
