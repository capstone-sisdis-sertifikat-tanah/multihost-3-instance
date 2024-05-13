CHANNEL_NAME="bpnchannel"

export PATH=${PWD}/bin:$PATH

cd network

export FABRIC_CFG_PATH=$PWD/config/ 

echo $FABRIC_CFG_PATH

ORG_NAME_1="bpn"
ORG_NAME_2="supplychain"

CC_NAME="atcontract"
INVOKE_FUNCTION_NAME="InitLedger"
QUERY_FUNCTION_NAME="GetAllAssets"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="BpnMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/$ORG_NAME_1.example.com/peers/peer0.$ORG_NAME_1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/$ORG_NAME_1.example.com/users/Admin@$ORG_NAME_1.example.com/msp
export CORE_PEER_ADDRESS=10.184.0.8:7051

peer chaincode invoke -o 10.184.0.8:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C ${CHANNEL_NAME} -n $CC_NAME --peerAddresses $CORE_PEER_ADDRESS --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/$ORG_NAME_1.example.com/peers/peer0.$ORG_NAME_1.example.com/tls/ca.crt" --peerAddresses 10.184.0.9:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/$ORG_NAME_2.example.com/peers/peer0.$ORG_NAME_2.example.com/tls/ca.crt" -c '{"function":"'$INVOKE_FUNCTION_NAME'","Args":[]}'

peer chaincode query -C ${CHANNEL_NAME} -n $CC_NAME -c '{"Args":["'$QUERY_FUNCTION_NAME'"]}' | jq '.'