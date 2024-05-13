package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type CERTContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
// Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically

// var logger = flogging.MustGetLogger("PEContract")

type Sertifikat struct {
	ID           string   `json:"id"`
	Pemilik		 string   `json:"idPemilik"`
	Akta		 string   `json:"idAkta"`
	Lat		     string   `json:"lat"`
	Long		 string   `json:"long"`
	Lokasi 		 string	  `json:"lokasi"`
}

type SertifikatResult struct {
	ID           string   `json:"id"`
	Pemilik		 *User    `json:"pemilik"`
	Akta		 *Akta    `json:"akta"`
	Lat		     string   `json:"lat"`
	Long		 string   `json:"long"`
	Lokasi 		 string	  `json:"lokasi"`
	TxId	 	 []string `json: "txId"` 
}


type Akta struct {
	ID           string   `json:"id"`
	Dokumen		 string   `json:"idDokumen"`
	Status 		 string   `json:"status"`
	Pembeli		 string   `json:"idPembeli"`
	Penjual		 string   `json:"idPenjual"`
	Approvers 	 []string `json:"approvers"`
}

type User struct {
	ID          	string   `json:"id"`
	Name   			string   `json:"name"`
	Email 	 		string   `json:"email"`
	Role 			string 	 `json:"role"`
}

const (
	ER11 		= "ER11-Incorrect number of arguments, required %d arguments, but you have %d arguments"
	ER12        = "ER12-Akta with id '%s' already exists"
	ER13        = "ER13-Akta with id '%s' doesn't exist"
	ER14		= "ER14-Akta with status '%s' already exists"
	ER15		= "ER15-Akta with Dokumen '%s' doesn't exist"
	ER31        = "ER31-Failed to change to world state: %v"
	ER32        = "ER32-Failed to read from world state: %v"
	ER33        = "ER33-Failed to get result from iterator: %v"
	ER34        = "ER34-Failed unmarshaling JSON: %v"
	ER37        = "ER37-Failed to query another chaincode (%s): %v."
	ER41        = "ER41-Access is not permitted with MSDPID '%s'"
	ER42        = "ER42-Unknown MSPID: '%s'"
)



// CreateAsset issues a new asset to the world state with given details.
func (s *CERTContract) CreateCERT(ctx contractapi.TransactionContextInterface, jsonData string) error {
	var sertifikat Sertifikat
	err := json.Unmarshal([]byte(jsonData), &sertifikat)
	if err != nil {
		return fmt.Errorf("failed to Unmarshal JSON: %v", err)
	}

	exists, err := isSertifikatExists(ctx, sertifikat.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf( sertifikat.ID)
	}
	
	sertifikatJSON, err := json.Marshal(sertifikat)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(sertifikat.ID, sertifikatJSON)
	if err != nil {
		fmt.Errorf(err.Error())
	}
	return err

}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Sertifikat, error) {
	// logger.Infof("Run constructQueryResponseFromIterator function.")

	var sertifikatList []*Sertifikat

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
		}

		var sertifikat Sertifikat
		err = json.Unmarshal(queryResult.Value, &sertifikat)
		if err != nil {
		}
		sertifikatList = append(sertifikatList, &sertifikat)
	}

	return sertifikatList, nil
}

// ReadAsset returns the asset stored in the world state with given id.
func (s *CERTContract) ReadAllCert(ctx contractapi.TransactionContextInterface) ([]*Sertifikat, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 0 {

	}

	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf(err.Error())
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIterator(resultsIterator)
}

func (s *CERTContract) GetCertById(ctx contractapi.TransactionContextInterface) (*SertifikatResult, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	sertifikat, err := getSertifikatStateById(ctx, id)
	if err != nil {
		return nil, err
	}
	sertifikatResult, err := getCompleteAktaDok(ctx, sertifikat)
	if err != nil {
		return nil, err
	}

	return sertifikatResult, nil
}

func (s *CERTContract) GetCertByIdNotFull(ctx contractapi.TransactionContextInterface) (*Sertifikat, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	sertifikat, err := getSertifikatStateById(ctx, id)
	if err != nil {
		return nil, err
	}

	return sertifikat, nil
}




func getCompleteAktaDok(ctx contractapi.TransactionContextInterface, sertifikat *Sertifikat) (*SertifikatResult, error) {
	// logger.Infof("Run getCompleteDataKls function with kls id: '%s'.", perusahaan.ID)

	var sertifikatResult SertifikatResult

	sertifikatResult.ID = sertifikat.ID
	sertifikatResult.Lat = sertifikat.Lat
	sertifikatResult.Long  = sertifikat.Long
	sertifikatResult.Lokasi = sertifikat.Lokasi

	pemilik, err := GetUserById(ctx, sertifikat.Pemilik)
	if err!=nil {
		return nil, err
	}
	sertifikatResult.Pemilik = pemilik

	if(sertifikat.Akta == ""){
		sertifikatResult.Akta = nil
	}else {
		akta, err := GetAktaById(ctx, sertifikat.Akta)
		if err!=nil {
			return nil, err
		}
		sertifikatResult.Akta = akta
	}
	
	
	txId, err := getHistorySertifikatTxIdById(ctx, sertifikat.ID)
	if err != nil {
		return nil, err
	}
	sertifikatResult.TxId = txId

	return &sertifikatResult, nil
}

func GetUserById(ctx contractapi.TransactionContextInterface, id string) (*User, error) {
	// logger.Infof("Run getSpById function with idSp: '%s'.", idSp)

	params := []string{"GetUserById", id}
	queryArgs := make([][]byte, len(params))
	for i, arg := range params {
		queryArgs[i] = []byte(arg)
	}

	response := ctx.GetStub().InvokeChaincode("usercontract", queryArgs, "bpnchannel")
	if response.Status != shim.OK {
		return nil, fmt.Errorf(ER37, "usercontract", response.Message)
	}

	var user User
	err := json.Unmarshal([]byte(response.Payload), &user)
	if err != nil {
		return nil, fmt.Errorf(ER34, err)
	}

	return &user, nil
}

func GetAktaById(ctx contractapi.TransactionContextInterface, id string) (*Akta, error) {
	// logger.Infof("Run getSpById function with idSp: '%s'.", idSp)

	params := []string{"GetAktaByIdNotFull", id}
	queryArgs := make([][]byte, len(params))
	for i, arg := range params {
		queryArgs[i] = []byte(arg)
	}

	response := ctx.GetStub().InvokeChaincode("aktacontract", queryArgs, "bpnchannel")
	if response.Status != shim.OK {
		return nil, fmt.Errorf(ER37, "aktacontract", response.Message)
	}

	var akta Akta
	err := json.Unmarshal([]byte(response.Payload), &akta)
	if err != nil {
		return nil, fmt.Errorf(ER34, err)
	}

	return &akta, nil
}



func getHistorySertifikatTxIdById(ctx contractapi.TransactionContextInterface, id string) ([]string, error) {
	// logger.Infof("Run getTskAddApprovalTxIdById function with id: %s.", id)
	
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return []string{}, fmt.Errorf(err.Error())
	}
	defer resultsIterator.Close()

	txIdList := []string{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return []string{}, fmt.Errorf(err.Error())
		}
		var sertifikat Sertifikat
		err = json.Unmarshal([]byte(response.Value), &sertifikat)
		if err != nil {
			return nil, fmt.Errorf(ER34, err)
		}
		txIdList = append([]string{response.TxId}, txIdList[0:]...)
	}

	return txIdList, nil
}

func (s *CERTContract) GetSertifikatHistory(ctx contractapi.TransactionContextInterface) ([]Sertifikat, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return []Sertifikat{}, fmt.Errorf(err.Error())
	}
	defer resultsIterator.Close()

	historyObject := []Sertifikat{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return []Sertifikat{}, fmt.Errorf(err.Error())
		}
		var sertifikat Sertifikat
		err = json.Unmarshal([]byte(response.Value), &sertifikat)
		if err != nil {
			return nil, fmt.Errorf(ER34, err)
		}
		historyObject = append(historyObject, sertifikat)
	}

	return historyObject, nil
}

func getSertifikatStateById(ctx contractapi.TransactionContextInterface, id string) (*Sertifikat, error) {

	sertifikatJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
	}
	if sertifikatJSON == nil {
	}

	var sertifikat Sertifikat
	err = json.Unmarshal(sertifikatJSON, &sertifikat)
	if err != nil {
	}

	return &sertifikat, nil
}

// UpdateAsset updates an existing asset in the world state with provided parameters.
func (s *CERTContract) UpdateSertifikat(ctx contractapi.TransactionContextInterface , jsonData string) error {

	var sertifikat SertifikatResult
	err := json.Unmarshal([]byte(jsonData), &sertifikat)
   
	if err != nil {
	 return fmt.Errorf("Failed to Unmarshal input JSON: %v", err)
	}
   


	sertifikatRes, err := getSertifikatStateById(ctx, sertifikat.ID)
	if err != nil {
		return err
	}

	sertifikatRes.ID = sertifikat.ID
	sertifikatRes.Pemilik = sertifikat.Pemilik.ID
	sertifikatRes.Akta = sertifikat.Akta.ID
	sertifikatRes.Lat = sertifikat.Lat
	sertifikatRes.Long = sertifikat.Long 

	sertifikatJSON, err := json.Marshal(sertifikatRes)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(sertifikatRes.ID, sertifikatJSON)
	if err != nil {
		return fmt.Errorf("Failed to Update Sertifikat: %v", err)
	}

	return err
}

// DeleteAsset deletes an given asset from the world state.
func (s *CERTContract) DeleteDok(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}

	id := args[0]

	exists, err := isSertifikatExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
	}

	err = ctx.GetStub().DelState(id)
	if err != nil {
	}

	return err
}

func (s *CERTContract) GetAllCertificate(ctx contractapi.TransactionContextInterface) ([]*Sertifikat, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*Sertifikat
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Sertifikat
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}




func (s *CERTContract) GetAllAktaByPemilik(ctx contractapi.TransactionContextInterface) ([]*Sertifikat, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"idPemilik":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var sertifikatList []*Sertifikat


	for _, sertifikat := range queryResult {
		sertifikatList = append(sertifikatList, sertifikat)
	}
	
	return sertifikatList, nil
}


func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Sertifikat, error) {

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf(ER32, err)
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIterator(resultsIterator)
}

func isSertifikatExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {

	aktaJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	return aktaJSON != nil, nil
}