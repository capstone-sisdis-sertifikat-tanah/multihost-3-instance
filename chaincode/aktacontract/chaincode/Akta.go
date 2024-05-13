package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type AKTAContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
// Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically

// var logger = flogging.MustGetLogger("PEContract")



type Akta struct {
	ID           string   `json:"id"`
	Dokumen		 string   `json:"idDokumen"`
	Status 		 string   `json:"status"`
	Pembeli		 string   `json:"idPembeli"`
	Penjual		 string   `json:"idPenjual"`
	Approvers 	 []string `json:"approvers"`
}


type Dokumen struct {
	ID           string   `json:"id"`
	Pembeli		  *User   `json:"pembeli"`
	Penjual		  *User   `json:"penjual"`
	Status 		 string   `json:"status"`
	Approvers 	 []string `json:"approvers"`
	Sertifikat   string   `json:"idSertifikat"`
}

type AktaResult struct {
	ID           string   `json:"id"`
	Pembeli		 *User    `json:"pembeli"`
	Penjual		 *User    `json:"penjual"`
	Dokumen		 *Dokumen `json:"dokumen"`
	Status 		 string   `json:"status"`
	Approvers 	 []string `json:"approvers"` 
	TxId		 []string `json:"TxId"`
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
func (s *AKTAContract) CreateAKTA(ctx contractapi.TransactionContextInterface,jsonData string) error {
	var akta Akta
	err := json.Unmarshal([]byte(jsonData), &akta)
	if err != nil {
		return fmt.Errorf("failed to Unmarshal JSON: %v", err)
	}

	exists, err := isAktaExists(ctx, akta.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf( akta.ID)
	}
	
	aktaJSON, err := json.Marshal(akta)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(akta.ID, aktaJSON)
	if err != nil {
		fmt.Errorf(err.Error())
	}
	return err

}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Akta, error) {
	// logger.Infof("Run constructQueryResponseFromIterator function.")

	var aktaList []*Akta

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
		}

		var akta Akta
		err = json.Unmarshal(queryResult.Value, &akta)
		if err != nil {
		}
		aktaList = append(aktaList, &akta)
	}

	return aktaList, nil
}

// ReadAsset returns the asset stored in the world state with given id.
func (s *AKTAContract) ReadAllAkta(ctx contractapi.TransactionContextInterface) ([]*Akta, error) {
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

func (s *AKTAContract) ReadAllDok(ctx contractapi.TransactionContextInterface) ([]*Akta, error) {
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

func (s *AKTAContract) GetAktaById(ctx contractapi.TransactionContextInterface) (*AktaResult, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	akta, err := getAktaStateById(ctx, id)
	if err != nil {
		return nil, err
	}
	AktaResult, err := getCompleteAktaDok(ctx, akta)
	if err != nil {
		return nil, err
	}

	return AktaResult, nil
}

func (s *AKTAContract) GetAktaByIdNotFull(ctx contractapi.TransactionContextInterface) (*Akta, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	akta, err := getAktaStateById(ctx, id)
	if err != nil {
		return nil, err
	}

	return akta, nil
}


func getCompleteAktaDok(ctx contractapi.TransactionContextInterface, akta *Akta) (*AktaResult, error) {
	// logger.Infof("Run getCompleteDataKls function with kls id: '%s'.", perusahaan.ID)

	var aktaResult AktaResult

	aktaResult.ID = akta.ID
	aktaResult.Status = akta.Status
	aktaResult.Approvers = akta.Approvers

	pembeli, err := GetUserById(ctx, akta.Pembeli)
	if err!=nil {
		return nil, err
	}
	aktaResult.Pembeli = pembeli

	penjual, err := GetUserById(ctx, akta.Penjual)
	if err!=nil {
		return nil, err
	}
	aktaResult.Penjual = penjual

	dokumen, err := GetDokumenById(ctx, akta.Dokumen)
	if err!=nil {
		return nil, err
	}
	aktaResult.Dokumen = dokumen
	
	txId, err := getAktaTxIdById(ctx, akta.ID)
	if err != nil {
		return nil, err
	}
	aktaResult.TxId = txId

	return &aktaResult, nil
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
func GetDokumenById(ctx contractapi.TransactionContextInterface, id string) (*Dokumen, error) {
	// logger.Infof("Run getSpById function with idSp: '%s'.", idSp)

	params := []string{"GetDokByIdNotFull", id}
	queryArgs := make([][]byte, len(params))
	for i, arg := range params {
		queryArgs[i] = []byte(arg)
	}

	response := ctx.GetStub().InvokeChaincode("dokcontract", queryArgs, "bpnchannel")
	if response.Status != shim.OK {
		return nil, fmt.Errorf(ER37, "dokcontract", response.Message)
	}

	var dokumen Dokumen
	err := json.Unmarshal([]byte(response.Payload), &dokumen)
	if err != nil {
		return nil, fmt.Errorf(ER34, err)
	}

	return &dokumen, nil
}

func getAktaTxIdById(ctx contractapi.TransactionContextInterface, id string) ([]string, error) {
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
		var akta Akta
		err = json.Unmarshal([]byte(response.Value), &akta)
		if err != nil {
			return nil, fmt.Errorf(ER34, err)
		}

		if (len(akta.Approvers) == 0) {
			break
		}
		txIdList = append([]string{response.TxId}, txIdList[0:]...)
	}

	return txIdList, nil
}

func getAktaStateById(ctx contractapi.TransactionContextInterface, id string) (*Akta, error) {

	aktaJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
	}
	if aktaJSON == nil {
	}

	var akta Akta
	err = json.Unmarshal(aktaJSON, &akta)
	if err != nil {
	}

	return &akta, nil
}

// UpdateAsset updates an existing asset in the world state with provided parameters.
func (s *AKTAContract) UpdateAkta(ctx contractapi.TransactionContextInterface , jsonData string) error {

	var akta AktaResult
	err := json.Unmarshal([]byte(jsonData), &akta)
   
	if err != nil {
	 return fmt.Errorf("Failed to Unmarshal input JSON: %v", err)
	}
   


	aktaRes, err := getAktaStateById(ctx, akta.ID)
	if err != nil {
		return err
	}

	aktaRes.ID = akta.ID
	aktaRes.Pembeli = akta.Pembeli.ID
	aktaRes.Penjual = akta.Penjual.ID
	aktaRes.Dokumen = akta.Dokumen.ID
	aktaRes.Status = akta.Status
	aktaRes.Approvers = akta.Approvers

	aktaJSON, err := json.Marshal(aktaRes)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(aktaRes.ID, aktaJSON)
	if err != nil {
		return fmt.Errorf("Failed to Update Akta: %v", err)
	}

	return err
}

// DeleteAsset deletes an given asset from the world state.
func (s *AKTAContract) DeleteDok(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}

	id := args[0]

	exists, err := isAktaExists(ctx, id)
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

func (s *AKTAContract) GetAllAktaByPembeli(ctx contractapi.TransactionContextInterface) ([]*Akta, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"idPembeli":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var aktaList []*Akta


	for _, akta := range queryResult {
		aktaList = append(aktaList, akta)
	}
	
	return aktaList, nil
}

func (s *AKTAContract) GetAllAktaByPenjual(ctx contractapi.TransactionContextInterface) ([]*Akta, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"idPenjual":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var aktaList []*Akta


	for _, akta := range queryResult {
		aktaList = append(aktaList, akta)
	}
	
	return aktaList, nil
}
func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Akta, error) {

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("ER32", err)
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIterator(resultsIterator)
}

func isAktaExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {

	aktaJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	return aktaJSON != nil, nil
}