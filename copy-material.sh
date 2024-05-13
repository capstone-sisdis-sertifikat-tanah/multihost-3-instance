#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Usage: $0 <h1 | h2>"
    echo "Example: $0 h1"
    exit 1
fi

export PATH_BPN='/home/backend/network/organizations/peerOrganizations/bpn.example.com'
export PATH_SUPPLY_CHAIN='/home/backend/network/organizations/peerOrganizations/supplychain.example.com'
export PATH_PEER_ORGANIZATIONS='/home/backend/network/organizations/peerOrganizations'
export PATH_ORDERER='/home/backend/network/organizations/ordererOrganizations'

ARG=$1

if [ "$ARG" == "h1" ]; then
    # Create directories if they don't exist on instance-supplychain1
    ssh instance-supplychain1 "[ -d $PATH_ORDERER ] || mkdir -p $PATH_ORDERER"
    ssh instance-supplychain1 "[ -d $PATH_BPN ] || mkdir -p $PATH_BPN"

    gcloud compute scp --recurse $PATH_ORDERER instance-supplychain1:$PATH_ORDERER
    gcloud compute scp --recurse $PATH_BPN instance-supplychain1:$PATH_BPN

    # Create directories if they don't exist on instance-supplychain2
    ssh instance-supplychain2 "[ -d $PATH_ORDERER ] || mkdir -p $PATH_ORDERER"
    ssh instance-supplychain2 "[ -d $PATH_BPN ] || mkdir -p $PATH_BPN"

    gcloud compute scp --recurse $PATH_ORDERER instance-supplychain2:$PATH_ORDERER
    gcloud compute scp --recurse $PATH_PEER_ORGANIZATIONS instance-supplychain2:$PATH_PEER_ORGANIZATIONS

elif [ "$ARG" == "h2" ]; then
    # Create directory if it doesn't exist on instance-bpn
    ssh instance-bpn "[ -d $PATH_SUPPLY_CHAIN ] || mkdir -p $PATH_SUPPLY_CHAIN"

    gcloud compute scp --recurse $PATH_SUPPLY_CHAIN instance-bpn:$PATH_SUPPLY_CHAIN

    # Create directory if it doesn't exist on instance-supplychain2
    ssh instance-supplychain2 "[ -d $PATH_SUPPLY_CHAIN ] || mkdir -p $PATH_SUPPLY_CHAIN"

    gcloud compute scp --recurse $PATH_SUPPLY_CHAIN instance-supplychain2:$PATH_SUPPLY_CHAIN


else
    echo "Invalid argument. Please use 'h1' or 'h2'."
    exit 1
fi