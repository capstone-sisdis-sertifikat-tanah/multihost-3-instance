#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Usage: $0 <h1 | h2>"
    echo "Example: $0 h1"
    exit 1
fi

export PATH_BPN='/home/backend/network/organizations/peerOrganizations/bpn.example.com'
export PATH_USER='/home/backend/network/organizations/peerOrganizations/user.example.com'
export PATH_PEER_ORGANIZATIONS='/home/backend/network/organizations/peerOrganizations'
export PATH_ORDERER='/home/backend/network/organizations/ordererOrganizations'

ARG=$1

if [ "$ARG" == "h1" ]; then
    # Create directories if they don't exist on instance-user1
    ssh instance-user1 "[ -d $PATH_ORDERER ] || mkdir -p $PATH_ORDERER"
    ssh instance-user1 "[ -d $PATH_BPN ] || mkdir -p $PATH_BPN"

    gcloud compute scp --recurse $PATH_ORDERER instance-user1:$PATH_ORDERER
    gcloud compute scp --recurse $PATH_BPN instance-user1:$PATH_BPN

    # Create directories if they don't exist on instance-user2
    ssh instance-user2 "[ -d $PATH_ORDERER ] || mkdir -p $PATH_ORDERER"
    ssh instance-user2 "[ -d $PATH_BPN ] || mkdir -p $PATH_BPN"

    gcloud compute scp --recurse $PATH_ORDERER instance-user2:$PATH_ORDERER
    gcloud compute scp --recurse $PATH_PEER_ORGANIZATIONS instance-user2:$PATH_PEER_ORGANIZATIONS

elif [ "$ARG" == "h2" ]; then
    # Create directory if it doesn't exist on instance-bpn
    ssh instance-bpn "[ -d $PATH_USER ] || mkdir -p $PATH_USER"

    gcloud compute scp --recurse $PATH_USER instance-bpn:$PATH_USER

    # Create directory if it doesn't exist on instance-user2
    ssh instance-user2 "[ -d $PATH_USER ] || mkdir -p $PATH_USER"

    gcloud compute scp --recurse $PATH_USER instance-user2:$PATH_USER


else
    echo "Invalid argument. Please use 'h1' or 'h2'."
    exit 1
fi