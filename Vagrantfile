Vagrant.configure("2") do |config|

  # Lightweight Ubuntu box
  config.vm.box = "ubuntu/focal64"

  # Sync the current directory to /vagrant inside the VM
  config.vm.synced_folder ".", "/vagrant"

  # Provision Docker and Docker Compose
  config.vm.provision "shell", inline: <<-SHELL
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release

  # Add Docker's official GPG key
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  # Add the repository to Apt sources
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  usermod -aG docker vagrant
  newgrp docker
  SHELL

  # Run docker compose up automatically when the VM boots
  config.vm.provision "shell", run: "always", inline: <<-SHELL
    cd /vagrant
    chmod +x setup_volumes.sh
    ./setup_volumes.sh
    docker compose build
    docker compose up -d
  SHELL


  # Virtualbox provider settings
    config.vm.provider "virtualbox" do |vb|
        vb.name = "Transcendence"
        vb.memory = "6144"
        vb.cpus = 6
    end
  # Network settings
  config.vm.network "forwarded_port", guest: 80, host: 80
  config.vm.network "forwarded_port", guest: 443, host: 443
end
