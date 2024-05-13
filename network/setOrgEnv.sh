#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0




# default to using Kementrian
ORG=${1:-KEMENTRIAN}

# Exit on first error, print all commands.
set -e
set -o pipefail

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

ORDERER_CA=${DIR}/network/organizations/ordererOrganizations/example.com/tlsca/tlsca.orderer.example.com-cert.pem
PEER0_KEMENTRIAN_CA=${DIR}/network/organizations/peerOrganizations/kementrian.example.com/tlsca/tlsca.kementrian.example.com-cert.pem
PEER0_SUPPLYCHAIN_CA=${DIR}/network/organizations/peerOrganizations/supplychain.example.com/tlsca/tlsca.supplychain.example.com-cert.pem
PEER0_ORG3_CA=${DIR}/network/organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem


if [[ ${ORG,,} == "kementrian" || ${ORG,,} == "digibank" ]]; then

   CORE_PEER_LOCALMSPID=KementrianMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/network/organizations/peerOrganizations/kementrian.example.com/users/Admin@kementrian.example.com/msp
   CORE_PEER_ADDRESS=localhost:7051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/network/organizations/peerOrganizations/kementrian.example.com/tlsca/tlsca.kementrian.example.com-cert.pem

elif [[ ${ORG,,} == "supplychain" || ${ORG,,} == "magnetocorp" ]]; then

   CORE_PEER_LOCALMSPID=SupplyChainMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/network/organizations/peerOrganizations/supplychain.example.com/users/Admin@supplychain.example.com/msp
   CORE_PEER_ADDRESS=localhost:9051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/network/organizations/peerOrganizations/supplychain.example.com/tlsca/tlsca.supplychain.example.com-cert.pem

else
   echo "Unknown \"$ORG\", please choose Kementrian/Digibank or SupplyChain/Magnetocorp"
   echo "For example to get the environment variables to set upa SupplyChain shell environment run:  ./setOrgEnv.sh SupplyChain"
   echo
   echo "This can be automated to set them as well with:"
   echo
   echo 'export $(./setOrgEnv.sh SupplyChain | xargs)'
   exit 1
fi

# output the variables that need to be set
echo "CORE_PEER_TLS_ENABLED=true"
echo "ORDERER_CA=${ORDERER_CA}"
echo "PEER0_KEMENTRIAN_CA=${PEER0_KEMENTRIAN_CA}"
echo "PEER0_SUPPLYCHAIN_CA=${PEER0_SUPPLYCHAIN_CA}"
echo "PEER0_ORG3_CA=${PEER0_ORG3_CA}"

echo "CORE_PEER_MSPCONFIGPATH=${CORE_PEER_MSPCONFIGPATH}"
echo "CORE_PEER_ADDRESS=${CORE_PEER_ADDRESS}"
echo "CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE}"

echo "CORE_PEER_LOCALMSPID=${CORE_PEER_LOCALMSPID}"
