# ./deploy.sh cecontract h1

ARG=$1
CCSTEP=$2


cd network

./network.sh deployCC -ccn $ARG -ccp ../chaincode/$ARG -ccl go --ccstep $CCSTEP 