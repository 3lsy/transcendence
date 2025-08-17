ui = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/vault.crt"
  tls_key_file  = "/vault/certs/vault.key"
}

storage "file" {
  path = "/vault/data"
}

disable_mlock = true

telemetry {
  disable_hostname = true
  prometheus_retention_time = "12h"
}
