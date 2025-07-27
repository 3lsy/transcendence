#!/bin/bash

filebeat -e -c /etc/filebeat/filebeat.yml &

/usr/sbin/httpd -DFOREGROUND
