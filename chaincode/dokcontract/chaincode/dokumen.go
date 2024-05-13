package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type DOKContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
// Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically

// var logger = flogging.MustGetLogger("PEContract")



type Dokumen struct {
	ID           string   `json:"id"`
	Pembeli		 string   `json:"idPembeli"`
	Penjual		 string   `json:"idPenjual"`
	Status 		 string   `json:"status"`
	Approvers 	 []string `json:"approvers"`
	Sertifikat   string   `json:"idSertifikat"`
}

type DokumenShortRes struct {
	ID           string   `json:"id"`
	Pembeli		 *User   `json:"pembeli"`
	Penjual		 *User   `json:"penjual"`
	Status 		 string   `json:"status"`
	Approvers 	 []string `json:"approvers"`
	Sertifikat   string   `json:"idSertifikat"`
}

type DokumenResult struct {
	ID           string   	 `json:"id"`
	Pembeli		 *User     	 `json:"pembeli"`
	Penjual		 *User     	 `json:"penjual"`
	Status 		 string   	 `json:"status"`
	Approvers 	 []string 	 `json:"approvers"`
	Sertifikat   *Sertifikat `json:"sertifikat"`
	TxId		 []string 	 `json:"TxId"`
}

type Sertifikat struct {
	ID           string   `json:"id"`
	Pemilik		 string   `json:"idPemilik"`
	Akta		 string   `json:"idAkta"`
	Lat		     string   `json:"lat"`
	Long		 string   `json:"long"`
	Lokasi		 string	  `json:"lokasi"`
	
}
type User struct {
	ID          	string   `json:"id"`
	Name   			string   `json:"name"`
	Email 	 		string   `json:"email"`
	Role 			string 	 `json:"role"`
}

const (
	ER11 		= "ER11-Incorrect number of arguments, required %d arguments, but you have %d arguments"
	ER12        = "ER12-Dokumen with id '%s' already exists"
	ER13        = "ER13-Dokumen with id '%s' doesn't exist"
	ER14		= "ER14-Dokumen with pembeli '%s' already exists"
	ER15		= "ER15-Dokumen with penjual '%s' doesn't exist"
	ER31        = "ER31-Failed to change to world state: %v"
	ER32        = "ER32-Failed to read from world state: %v"
	ER33        = "ER33-Failed to get result from iterator: %v"
	ER34        = "ER34-Failed unmarshaling JSON: %v"
	ER37        = "ER37-Failed to query another chaincode (%s): %v."
	ER41        = "ER41-Access is not permitted with MSDPID '%s'"
	ER42        = "ER42-Unknown MSPID: '%s'"
)



// CreateAsset issues a new asset to the world state with given details.
func (s *DOKContract) CreateDOK(ctx contractapi.TransactionContextInterface,jsonData string) error {
	var dok Dokumen
	err := json.Unmarshal([]byte(jsonData), &dok)
	if err != nil {
		return fmt.Errorf("failed to Unmarshal JSON: %v", err)
	}

	exists, err := isDokExists(ctx, dok.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf( dok.ID)
	}
	dokJSON, err := json.Marshal(dok)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(dok.ID, dokJSON)
	if err != nil {
		fmt.Errorf(err.Error())
	}
	return err

}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Dokumen, error) {
	// logger.Infof("Run constructQueryResponseFromIterator function.")

	var dokumenList []*Dokumen

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
		}

		var dokumen Dokumen
		err = json.Unmarshal(queryResult.Value, &dokumen)
		if err != nil {
		}
		dokumenList = append(dokumenList, &dokumen)
	}

	return dokumenList, nil
}

func (s *DOKContract) ReadAllDok(ctx contractapi.TransactionContextInterface) ([]*Dokumen, error) {
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

func (s *DOKContract) GetDokById(ctx contractapi.TransactionContextInterface) (*DokumenResult, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	dok, err := getDokStateById(ctx, id)
	if err != nil {
		return nil, err
	}
	dokResult, err := getCompleteDataDok(ctx, dok)
	if err != nil {
		return nil, err
	}

	return dokResult, nil
}

func (s *DOKContract) GetDokByIdNotFull(ctx contractapi.TransactionContextInterface) (*DokumenShortRes, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	dok, err := getDokStateById(ctx, id)
	if err != nil {
		return nil, err
	}
	var dokumenResult DokumenShortRes
	dokumenResult.ID = dok.ID
	dokumenResult.Sertifikat = dok.Sertifikat
	dokumenResult.Status = dok.Status
	pembeli, err := GetUserById(ctx, dok.Pembeli)
	if err!=nil {
		return nil, err
	}
	dokumenResult.Pembeli = pembeli
	penjual, err := GetUserById(ctx, dok.Penjual)
	if err!=nil {
		return nil, err
	}
	dokumenResult.Pembeli = penjual
	dokumenResult.Approvers = dok.Approvers

	
	return &dokumenResult, nil
}


func getCompleteDataDok(ctx contractapi.TransactionContextInterface, dok *Dokumen) (*DokumenResult, error) {
	// logger.Infof("Run getCompleteDataKls function with kls id: '%s'.", perusahaan.ID)

	var dokumenResult DokumenResult

	dokumenResult.ID = dok.ID
	dokumenResult.Status = dok.Status
	dokumenResult.Approvers = dok.Approvers

	pembeli, err := GetUserById(ctx, dok.Pembeli)
	if err!=nil {
		return nil, err
	}
	dokumenResult.Pembeli = pembeli

	penjual, err := GetUserById(ctx, dok.Penjual)
	if err!=nil {
		return nil, err
	}
	dokumenResult.Penjual = penjual

	sertifikat, err := GetSertifikatById(ctx, dok.Sertifikat)
	if err!=nil {
		return nil, err
	}
	dokumenResult.Sertifikat = sertifikat
	
	txId, err := getDokTxIdById(ctx, dok.ID)
	if err != nil {
		return nil, err
	}
	dokumenResult.TxId = txId

	return &dokumenResult, nil
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

func GetSertifikatById(ctx contractapi.TransactionContextInterface, id string) (*Sertifikat, error) {
	// logger.Infof("Run getSpById function with idSp: '%s'.", idSp)

	params := []string{"GetCertByIdNotFull", id}
	queryArgs := make([][]byte, len(params))
	for i, arg := range params {
		queryArgs[i] = []byte(arg)
	}

	response := ctx.GetStub().InvokeChaincode("certcontract", queryArgs, "bpnchannel")
	if response.Status != shim.OK {
		return nil, fmt.Errorf(ER37, "certcontract", response.Message)
	}

	var sertifikat Sertifikat
	err := json.Unmarshal([]byte(response.Payload), &sertifikat)
	if err != nil {
		return nil, fmt.Errorf(ER34, err)
	}

	return &sertifikat, nil
}

func getDokTxIdById(ctx contractapi.TransactionContextInterface, id string) ([]string, error) {
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
		var dok Dokumen
		err = json.Unmarshal([]byte(response.Value), &dok)
		if err != nil {
			return nil, fmt.Errorf(ER34, err)
		}

		if (len(dok.Approvers) == 0) {
			break
		}
		txIdList = append([]string{response.TxId}, txIdList[0:]...)
	}

	return txIdList, nil
}

func getDokStateById(ctx contractapi.TransactionContextInterface, id string) (*Dokumen, error) {

	dokumenJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
	}
	if dokumenJSON == nil {
	}

	var dokumen Dokumen
	err = json.Unmarshal(dokumenJSON, &dokumen)
	if err != nil {
	}

	return &dokumen, nil
}

// UpdateAsset updates an existing asset in the world state with provided parameters.
func (s *DOKContract) UpdateDok(ctx contractapi.TransactionContextInterface , jsonData string) error {

	var dok DokumenResult
	err := json.Unmarshal([]byte(jsonData), &dok)
   
	if err != nil {
	 return fmt.Errorf("Failed to Unmarshal input JSON: %v", err)
	}
   


	dokRes, err := getDokStateById(ctx, dok.ID)
	if err != nil {
		return err
	}

	dokRes.ID = dok.ID
	dokRes.Pembeli = dok.Pembeli.ID
	dokRes.Penjual = dok.Penjual.ID
	dokRes.Status = dok.Status
	dokRes.Approvers = dok.Approvers

	dokJSON, err := json.Marshal(dokRes)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(dokRes.ID, dokJSON)
	if err != nil {
		return fmt.Errorf("Failed to Update Dokumen: %v", err)
	}

	return err
}

// DeleteAsset deletes an given asset from the world state.
func (s *DOKContract) DeleteDok(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}

	id := args[0]

	exists, err := isDokExists(ctx, id)
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

func (s *DOKContract) GetAllDokumenByPembeli(ctx contractapi.TransactionContextInterface) ([]*Dokumen, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"idPembeli":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var dokumenList []*Dokumen


	for _, dokumen := range queryResult {
		dokumenList = append(dokumenList, dokumen)
	}
	
	return dokumenList, nil
}

func (s *DOKContract) GetAllDokumenByPenjual(ctx contractapi.TransactionContextInterface) ([]*Dokumen, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"idPenjual":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var dokumenList []*Dokumen


	for _, dokumen := range queryResult {
		dokumenList = append(dokumenList, dokumen)
	}
	
	return dokumenList, nil
}

func (s *DOKContract) GetAllDokumenByStatus(ctx contractapi.TransactionContextInterface) ([]*Dokumen, error) {
	args := ctx.GetStub().GetStringArgs()[1:]
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, args[0])
	queryResult, err := getQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, err
	}
	var dokumenList []*Dokumen


	for _, dokumen := range queryResult {
		dokumenList = append(dokumenList, dokumen)
	}
	
	return dokumenList, nil
}

func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Dokumen, error) {

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("ER32", err)
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromIterator(resultsIterator)
}
func isDokExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {

	dokJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	return dokJSON != nil, nil
}