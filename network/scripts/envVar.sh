#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.orderer.example.com-cert.pem
export PEER0_BPN_CA=${PWD}/organizations/peerOrganizations/bpn.example.com/tlsca/tlsca.bpn.example.com-cert.pem
export PEER0_SUPPLYCHAIN_CA=${PWD}/organizations/peerOrganizations/supplychain.example.com/tlsca/tlsca.supplychain.example.com-cert.pem
export PEER1_SUPPLYCHAIN_CA=${PWD}/organizations/peerOrganizations/supplychain.example.com/tlsca/tlsca.supplychain.example.com-cert.pem

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  infoln "Using organization ${USING_ORG}"

  if [ $USING_ORG = 'bpnp0' ]; then
    export CORE_PEER_LOCALMSPID="BpnMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BPN_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/bpn.example.com/users/Admin@bpn.example.com/msp
    export CORE_PEER_ADDRESS="10.184.0.11:7051"
    export PEER_NAME="peer0.bpn.example.com"

  elif [ $USING_ORG = 'supplychainp0' ]; then
    export CORE_PEER_LOCALMSPID="SupplyChainMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_SUPPLYCHAIN_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/supplychain.example.com/users/Admin@supplychain.example.com/msp
    export CORE_PEER_ADDRESS="10.184.0.9:9051"
    export PEER_NAME="peer0.supplychain.example.com"
    
  elif [ $USING_ORG = 'supplychainp1' ]; then
    export CORE_PEER_LOCALMSPID="SupplyChainMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_SUPPLYCHAIN_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/supplychain.example.com/users/Admin@supplychain.example.com/msp
    export CORE_PEER_ADDRESS="10.184.0.10:9051"
    export PEER_NAME="peer1.supplychain.example.com"
  else
    echo $USING_ORG
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
  setGlobals $1

  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi

  if [ $USING_ORG = 'bpnp0' ]; then
    export CORE_PEER_ADDRESS="10.184.0.11:7051"
  elif [ $USING_ORG = 'supplychainp0' ]; then
    export CORE_PEER_ADDRESS="10.184.0.9:9051"
  elif [ $USING_ORG = 'supplychainp1' ]; then
    export CORE_PEER_ADDRESS="10.184.0.10:9051"
  else
    errorln "ORG Unknown"
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	    PEERS="$PEER_NAME"
    else
	    PEERS="$PEERS $PEER_NAME"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
    ## Set path to TLS certificate
    # CA="organizations/peerOrganizations/$1.example.com/peers/peer0.$1.example.com/tls/ca.crt"
    ORG_CAPITAL=${1^^}
    # CA=PEER${PEER_NUMBER}_${ORG_CAPITAL}_CA
    TLSINFO=(--tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}
verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}
