package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SCContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
// Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically

// var logger = flogging.MustGetLogger("SCCContract")

type SupplyChain struct {
	ID                  string                `json:"id"`
	ListPerusahaan      []string              `json:"listPerusahaan"`
	Status              string                `json:"status"`
	ProposalSupplyChain []ProposalSupplyChain `json:"proposalSupplyChain"`
}
type ProposalSupplyChain struct {
	IdPerusahaan string `json:"id"`
	Status       string `json:"status"`
}

type BMKGCertificateResult struct {
	NoCertificate   string          `json:"noSertifikat"`
	IdentitasAlat   IdentitasAlat   `json:"identitasAlat"`
	IdentitasLokasi IdentitasLokasi `json:"identitasLokasi"`
	Sensor          Sensor          `json:"sensor"`
	KondisiRuang    KondisiRuang    `json:"kondisiRuang"`
	HasilKalibrasi  HasilKalibrasi  `json:"hasilKalibrasi"`
}

type IdentitasAlat struct {
	NomorSeri  string   `json:"nomorSeri"`
	NamaAlat   string   `json:"namaAlat"`
	MerkPabrik string   `json:"merkPabrik"`
	Tipe       string   `json:"tipe"`
	LainLain   []string `json:"lain"`
}
type IdentitasLokasi struct {
	Nama   string `json:"nama"`
	Alamat string `json:"alamat"`
}

type HasilKalibrasi struct {
	Temperatur      Temperatur      `json:"temperatur"`
	KelembabanUdara KelembabanUdara `json:"kelembabanUdara"`
}

type Sensor struct {
	NamaSensor       string `json:"nama"`
	MerkAlat         string `json:"alamat"`
	Tipe             string `json:"tipe"`
	NoSeri           string `json:"noSeri"`
	Kapasitas        string `json:"kapasitas"`
	Graduasi         string `json:"graduasi"`
	TanggalKalibrasi string `json:"tanggalKalibrasi"`
	TempatKalibrasi  string `json:"tempatKalibrasi"`
}

type KondisiRuang struct {
	Suhu       string `json:"suhu"`
	Kelembaban string `json:"kelembaban"`
}

type Temperatur struct {
	SuhuStandar         string `json:"suhuStandar"`
	AlatYangDikalibrasi string `json:"alatYangDikalibrasi"`
	Koreksi             string `json:"koreksi"`
	U95                 string `json:"u95"`
}

type KelembabanUdara struct {
	RHStandar           string `json:"rhStandar"`
	AlatYangDikalibrasi string `json:"alatYangDikalibrasi"`
	Koreksi             string `json:"koreksi"`
	U95                 string `json:"u95"`
}

// Pembuatan Supply Chain
// 1. Admin perusahaan request ke admin Kementrian (admin perusahaan membuat object supplychain)
// 2. status SupplyChain Pending
// 3. Admin kementerian Review, kalo setuju approved kalo ga setuju reject
// 4. Kalo Setuju ngebuat semua proposal supply chain dengan yang isinya list perusahaan
// 5. Admin Kementerian membuat object proposalSupplyChain untuk semua perusahaan yang ada di ListPerusahaaanm, sehingga proposal menjadi pending status
// 6. Admin Perusahaan approved, mereject,
// 7. Supply Chain berjalan jikalau looping dari proposalSUpplychain Approved semua
// 8. Kalo ternyata salah satu dicancel status dari SupplyChain jadi Reject
// CreateAsset issues a new asset to the world state with given details.
func (s *SCContract) CreateCERT(ctx contractapi.TransactionContextInterface, args string) error {

	var cert BMKGCertificateResult
	err := json.Unmarshal([]byte(args), &cert)
   
	if err != nil {
	 return fmt.Errorf("Failed to Unmarshal input JSON: %v", err)
	}
   
	certJSON, err := json.Marshal(cert)
	if err != nil {
	 return err
	}
   
	err = ctx.GetStub().PutState(cert.NoCertificate, certJSON)
	if err != nil {
	 fmt.Errorf(err.Error())
	}
   
	return err
   }
func isScExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {

	cspJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	return cspJSON != nil, nil
}
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*SupplyChain, error) {
	// logger.Infof("Run constructQueryResponseFromIterator function.")

	var scList []*SupplyChain

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
		}

		var sc SupplyChain
		err = json.Unmarshal(queryResult.Value, &sc)
		if err != nil {
		}
		scList = append(scList, &sc)
	}

	return scList, nil
}

// ReadAsset returns the asset stored in the world state with given id.
func (s *SCContract) ReadAllSC(ctx contractapi.TransactionContextInterface) ([]*SupplyChain, error) {
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

func (s *SCContract) GetSCById(ctx contractapi.TransactionContextInterface) (*SupplyChain, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}
	id := args[0]
	csp, err := getSCStateById(ctx, id)
	if err != nil {
		return nil, err
	}

	return csp, nil
}
func getCompleteDataSupplyChain(ctx contractapi.TransactionContextInterface, sc *SupplyChain) (*SupplyChain, error) {
	// logger.Infof("Run getCompleteDataKls function with kls id: '%s'.", perusahaan.ID)

	var scr SupplyChain

	scr.ID = sc.ID
	scr.ListPerusahaan = nil
	scr.Status = sc.Status
	scr.ProposalSupplyChain = nil

	return &scr, nil
}
func getSCStateById(ctx contractapi.TransactionContextInterface, id string) (*SupplyChain, error) {

	scJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
	}
	if scJSON == nil {
	}

	var sc SupplyChain
	err = json.Unmarshal(scJSON, &sc)
	if err != nil {
	}

	return &sc, nil
}

// UpdateAsset updates an existing asset in the world state with provided parameters.
func (s *SCContract) UpdateSC(ctx contractapi.TransactionContextInterface, args string) error {
	var supplyChain SupplyChain
	err := json.Unmarshal([]byte(args), &supplyChain)

	if err != nil {
		return fmt.Errorf("Failed to Unmarshal input JSON: %v", err)
	}
	supplyChainJSON, err := json.Marshal(supplyChain)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(supplyChain.ID, supplyChainJSON)
	if err != nil {
		fmt.Errorf(err.Error())
	}
	return err

}

// DeleteAsset deletes an given asset from the world state.
func (s *SCContract) DeleteSC(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 1 {
	}

	id := args[0]

	exists, err := isScExists(ctx, id)
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
