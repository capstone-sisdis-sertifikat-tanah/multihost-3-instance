HOST="NA" #h1 #h2  #h3
CHANNELSTEP="NA" #joinh1 #joinh2 #joinh3
DEPLOYCCSTEP="NA"
DEPLOYCCSTEPTEST="NA"
cd network

while [[ $# -ge 2 ]]; do
    case "$1" in
        -host)
            HOST="$2"
            ;;
        -chstep)
            CHANNELSTEP="$2" 
            ;;
        -ccstep)
            DEPLOYCCSTEP="$2"
            ;;
        *)
            echo "Unknown option: $2"
            exit 1
            ;;
    esac
    shift 2
done

if [ "$HOST" != "NA" ]; then
    ./network.sh up -ca -s couchdb -host $HOST
fi

if [ "$CHANNELSTEP" != "NA" ]; then
    ./network.sh createChannel -chstep $CHANNELSTEP
fi

if [ "$DEPLOYCCSTEP" != "NA" ]; then
    ./network.sh deployCC -ccn cecontract   -ccp ../chaincode/cecontract   -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn cspcontract  -ccp ../chaincode/cspcontract  -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn ctcontract   -ccp ../chaincode/ctcontract   -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn divcontract  -ccp ../chaincode/divcontract  -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn pecontract   -ccp ../chaincode/pecontract   -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn shcontract   -ccp ../chaincode/shcontract   -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn vecontract   -ccp ../chaincode/vecontract   -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn usercontract -ccp ../chaincode/usercontract -ccl go -ccstep $DEPLOYCCSTEP
    ./network.sh deployCC -ccn sccontract   -ccp ../chaincode/sccontract   -ccl go -ccstep $DEPLOYCCSTEP
fi

