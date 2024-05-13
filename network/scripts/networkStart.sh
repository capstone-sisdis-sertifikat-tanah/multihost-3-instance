#!/bin/bash

# Import utils
. scripts/utils.sh


function runCaContainer() {
  infoln "Starting docker container for Certificate Authority"
  println ""

  CA_COMPOSE_FILES=" -f compose/multi-host/docker-compose-ca.yaml"
  docker-compose ${CA_COMPOSE_FILES} up -d 2>&1

  println ""
}

function runHost1CaContainer() {
  infoln "Starting docker container for Certificate Authority"
  println ""

  CA_COMPOSE_FILES="-f compose/multi-host/docker-compose-host1-ca.yaml"
  docker-compose ${CA_COMPOSE_FILES} up -d 2>&1

  println ""
}

function runHost2CaContainer() {
  infoln "Starting docker container for Certificate Authority"
  println ""

  CA_COMPOSE_FILES="-f compose/multi-host/docker-compose-host2-ca.yaml"
  docker-compose ${CA_COMPOSE_FILES} up -d 2>&1

  println ""
}


function runHost1OrgContainer() {
  infoln "Starting docker container for All Organizations"
  println ""

  COMPOSE_FILES="-f compose/multi-host/docker-compose-host1-orderer.yaml -f compose/multi-host/docker-compose-host1-bpn.yaml"
  docker-compose ${COMPOSE_FILES} up -d 2>&1

  println ""
}

function runHost2OrgContainer() {
  infoln "Starting docker container for All Organizations"
  println ""

  COMPOSE_FILES="-f compose/multi-host/docker-compose-host2-user.yaml"
  docker-compose ${COMPOSE_FILES} up -d 2>&1

  println ""
}

function runHost3OrgContainer() {
  infoln "Starting docker container for All Organizations"
  println ""

  COMPOSE_FILES="-f compose/multi-host/docker-compose-host3-user.yaml"
  docker-compose ${COMPOSE_FILES} up -d 2>&1

  println ""
}

function startCAHost1() {
  infoln "Start CA"

  println "###########################################################################"
  runHost1CaContainer
  . organizations/fabric-ca/registerEnroll.sh

  
  while :
    do
      if [ ! -f "organizations/fabric-ca/bpn/tls-cert.pem" ]; then
        sleep 1
      else
        break
      fi
    done
  println "###########################################################################"
  infoln "Creating Bpn Certificates"
  createBpn
  println ""
  

  infoln "Creating Orderer Certificates"
  createOrderer
  println ""

  println ""
}

function startNetworkHost1() {
  CHANNEL_NAME=$1

  infoln "Start the network"

  println "###########################################################################"
  runHost1OrgContainer
  println ""

  println ""
}

function startCAHost2() {
  infoln "Start CA"

  println "###########################################################################"
  runHost2CaContainer
  . organizations/fabric-ca/registerEnroll.sh
  while :
    do
      if [ ! -f "organizations/fabric-ca/user/tls-cert.pem" ]; then
        sleep 1
      else
        break
      fi
    done
  
  println "###########################################################################"
  infoln "Creating User Certificates"
  createUser
  println ""

}

function startCAHost3() {
  infoln "Start CA"

  println "###########################################################################"
  
  . organizations/fabric-ca/registerEnroll.sh

  
  println "###########################################################################"
  infoln "Creating User Certificates"
  createUserPeer1
  println ""

}

function startNetworkHost2() {
  CHANNEL_NAME=$1

  println "###########################################################################"
  runHost2OrgContainer
  println ""

  println ""
}

function startNetworkHost3() {
  CHANNEL_NAME=$1

  infoln "Start the network"

  println "###########################################################################"
  runHost3OrgContainer
  println ""

  println ""
}
