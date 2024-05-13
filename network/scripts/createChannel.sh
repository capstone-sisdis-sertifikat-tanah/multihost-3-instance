#!/bin/bash

# imports  
. scripts/envVar.sh
. scripts/utils.sh


CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"
BFT="$5"
: ${CHANNEL_NAME:="carbonchannel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}
: ${BFT:=0}

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

if [ ! -d "channel-artifacts" ]; then
	mkdir channel-artifacts
fi

createChannelGenesisBlock() {
  setGlobals 'kementrianp0'
	which configtxgen
	if [ "$?" -ne 0 ]; then
		fatalln "configtxgen tool not found."
	fi
	local bft_true=$1
	set -x

	configtxgen -profile CarbonChannelUsingRaft -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME

	res=$?
	{ set +x; } 2>/dev/null
  verifyResult $res "Failed to generate channel configuration transaction..."
}

createChannel() {
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	local bft_true=$1
	infoln "Adding orderers"
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x
    . scripts/orderer.sh ${CHANNEL_NAME}> /dev/null 2>&1
    
		res=$?
		{ set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $res "Channel creation failed"
}

# joinChannel ORG
joinChannel() {
  ORG=$1
  FABRIC_CFG_PATH=$PWD/config/
  setGlobals $ORG
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
    peer channel join -b $BLOCKFILE >&log.txt
    res=$?
    { set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $res "After $MAX_RETRY attempts, peer0.${ORG} has failed to join channel '$CHANNEL_NAME' "
}

setAnchorPeer() {
  ORG=$1
  ${CONTAINER_CLI} exec cli ./scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME 
}


## User attempts to use BFT orderer in Fabric network with CA
if [ $BFT -eq 1 ] && [ -d "organizations/fabric-ca/ordererOrg/msp" ]; then
  fatalln "Fabric network seems to be using CA. This sample does not yet support the use of consensus type BFT and CA together."
fi

## Create channel genesis block
FABRIC_CFG_PATH=$PWD/config/
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

joinChannelH1() {
  # Join the peers to the channel
  infoln "Generating channel genesis block '${CHANNEL_NAME}.block'"
  createChannelGenesisBlock

  successln "Genesis block created"

  infoln "Creating channel ${CHANNEL_NAME}"
  createChannel
  successln "Channel '$CHANNEL_NAME' created"

  infoln "Joining Kementrian peer to the channel..."
  joinChannel 'kementrianp0'

  successln "Success Join Channel '$CHANNEL_NAME'"

  infoln "Setting anchor peer"
  setAnchorPeer 'kementrianp0'

  successln "Success Set Anchor Peer"
}

joinChannelH2() {
  # Join the peers to the channel
  infoln "Joining Supply Chain peer0 to the channel..."
  joinChannel 'supplychainp0'

  successln "Success Join Channel '$CHANNEL_NAME'"

  infoln "Setting anchor peer"
  setAnchorPeer 'supplychainp0'

  successln "Success Set Anchor Peer"
}

joinChannelH3() {
  # Join the peers to the channel
  infoln "Joining Supply Chain peer1 to the channel..."
  joinChannel 'supplychainp1'

  successln "Success Join Channel '$CHANNEL_NAME'"
  infoln "Setting anchor peer"
  setAnchorPeer 'supplychainp1'

  successln "Success Set Anchor Peer"
}