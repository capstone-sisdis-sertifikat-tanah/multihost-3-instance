package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric/common/flogging"
)

// SmartContract provides functions for managing an Asset
type UserContract struct {
	contractapi.Contract
}

// ============================================================================================================================
// Asset Definitions - The ledger will store User data
// ============================================================================================================================

type User struct {
	ID          	string   `json:"id"`
	Name   			string   `json:"name"`
	Email 	 		string   `json:"email"`
	Role 			string 	 `json:"role"`
}


// ============================================================================================================================
// Error Messages
// ============================================================================================================================

const (
	ER11 		= "ER11-Incorrect number of arguments, required %d arguments, but you have %d arguments"
	ER12        = "ER12-User with id '%s' already exists"
	ER13        = "ER13-User with id '%s' doesn't exist"
	ER14		= "ER14-User with nik '%s' already exists"
	ER15		= "ER15-User with email '%s' doesn't exist"
	ER31        = "ER31-Failed to change to world state: %v"
	ER32        = "ER32-Failed to read from world state: %v"
	ER33        = "ER33-Failed to get result from iterator: %v"
	ER34        = "ER34-Failed unmarshaling JSON: %v"
	ER41        = "ER41-Access is not permitted with MSDPID '%s'"
	ER42        = "ER42-Unknown MSPID: '%s'"
)

// ============================================================================================================================
// Logger
// ============================================================================================================================

var logger = flogging.MustGetLogger("UserContract")

// RegisterUser issues a new asset to the world state with given details.
func (s *UserContract) RegisterUser(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 4 {
		logger.Errorf(ER11, 4, len(args))
		return fmt.Errorf(ER11, 4, len(args))
	}

	id := args[0]
	name := args[1]
	email := args[2]
	role := args[3]

	exists, err := isUserExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf(ER12, id)
	}

	user := User{
		ID:    id,
		Name:  name,
		Email: email,
		Role:  role,
	}

	switch role {
	case "admin-bpn", "bank", "user", "notaris":
	default:
		return fmt.Errorf("unsupported role: %s", role)
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf(ER34, err.Error())
	}

	err = ctx.GetStub().PutState(id, userJSON)
	if err != nil {
		return fmt.Errorf(ER31, err.Error())
	}

	return nil
}

// UpdateUserData updates the general user data (excluding ManagerPerusahaan and AdminPerusahaan) for a user
func (s *UserContract) UpdateUserData(ctx contractapi.TransactionContextInterface) error {
	args := ctx.GetStub().GetStringArgs()[1:]

	if len(args) != 2 {
		logger.Errorf(ER11, 2, len(args))
		return fmt.Errorf(ER11, 2, len(args))
	}

	userId := args[0]
	newEmail := args[1]
	
	// Retrieve the user from the ledger
	user, err := getUserStateById(ctx, userId)
	if err != nil {
		return err
	}

	// Check if the new email is already used by another user
	if err := checkEmailAvailability(ctx, newEmail, userId); 
	err != nil {
		return err
	}

	// Update general user data
	user.Email = newEmail

	// Marshal the updated user object
	updatedUserJSON, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf(ER34, err.Error())
	}

	// Update the user data in the ledger
	err = ctx.GetStub().PutState(userId, updatedUserJSON)
	if err != nil {
		return fmt.Errorf(ER31, err.Error())
	}

	return nil
}

func (s *UserContract) GetUsers(ctx contractapi.TransactionContextInterface) ([]*User, error) {
    queryString := fmt.Sprintf(`{"selector":{"role":"user"}}`)
    return getQueryResultForQueryStringUser(ctx, queryString)
}

func (s *UserContract) GetAllRoles(ctx contractapi.TransactionContextInterface) ([]*User, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset User
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}


	return assets, nil
}


func (s *UserContract) GetUserById(ctx contractapi.TransactionContextInterface) (*User, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	logger.Infof("Run GetSmsById function with args: %+q.", args)

	if len(args) != 1 {
		logger.Errorf(ER11, 1, len(args))
		return nil, fmt.Errorf(ER11, 1, len(args))
	}
	id := args[0]
	user, err := getUserStateById(ctx, id)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByUsername used by Login method
func (s *UserContract) GetUserByUsername(ctx contractapi.TransactionContextInterface) (*User, error) {
	args := ctx.GetStub().GetStringArgs()[1:]

	logger.Infof("Run GetSmsById function with args: %+q.", args)

	if len(args) != 1 {
		logger.Errorf(ER11, 1, len(args))
		return nil, fmt.Errorf(ER11, 1, len(args))
	}
	username := args[0]
	queryString := fmt.Sprintf(`{"selector":{"name":"%s"}}`, username)

	var user User
	queryResult, err := getQueryResultForQueryStringUser(ctx, queryString)
	if err != nil {
		return nil, err
	}

	user.ID = queryResult[0].ID
	user.Name = queryResult[0].Name
	user.Email = queryResult[0].Email
	user.Role = queryResult[0].Role

	return &user, nil
}

func isUserExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {

	user, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	return user != nil, nil
}

// checkEmailAvailability checks if the new email is already used by another user
func checkEmailAvailability(ctx contractapi.TransactionContextInterface, newEmail, userId string) error {
	// Query the ledger to check if the email is already used by another user
	queryString := fmt.Sprintf(`{"selector":{"email":"%s"},"use_index":["_design/indexEmailDoc","indexEmail"]}`, newEmail)
	queryResults, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return fmt.Errorf("error querying the ledger: %v", err)
	}
	defer queryResults.Close()

	for queryResults.HasNext() {
		item, err := queryResults.Next()
		if err != nil {
			return fmt.Errorf("error iterating query results: %v", err)
		}

		var user User
		if err := json.Unmarshal(item.Value, &user); err != nil {
			return fmt.Errorf("error unmarshalling user data: %v", err)
		}

		// If the email belongs to a different user, return an error
		if user.ID != userId {
			return fmt.Errorf("email '%s' is already used by another user", newEmail)
		}
	}

	return nil
}

func getUserStateById(ctx contractapi.TransactionContextInterface, id string) (*User, error) {
	logger.Infof("Run getUserStateById function with id: '%s'.", id)

	userJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf(ER32, err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf(ER13, id)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, fmt.Errorf(ER34, err)
	}

	return &user, nil
}

func getQueryResultForQueryStringUser(ctx contractapi.TransactionContextInterface, queryString string) ([]*User, error) {
	logger.Infof("Run getQueryResultForQueryStringUser function with queryString: '%s'.", queryString)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf(ER32, err)
	}
	defer resultsIterator.Close()

	return constructQueryResponseFromUserIterator(resultsIterator)
}

func constructQueryResponseFromUserIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*User, error) {
	logger.Infof("Run constructQueryResponseFromUserIterator function.")

	var listUser []*User

	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf(ER33, err)
		}

		var user User
		err = json.Unmarshal(queryResult.Value, &user)
		if err != nil {
			return nil, fmt.Errorf(ER34, err)
		}
		listUser = append(listUser, &user)
	}

	return listUser, nil
}
