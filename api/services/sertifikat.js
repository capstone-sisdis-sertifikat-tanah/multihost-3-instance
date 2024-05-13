const iResp = require('../utils/response.interface.js')
const fabric = require('../utils/fabric.js')
const { BlockDecoder } = require('fabric-common')
const { bufferToJson } = require('../utils/converter.js')

const create = async (user, args) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    await network.contract.submitTransaction('CreateCERT', JSON.stringify(args))
    return iResp.buildSuccessResponse(
      200,
      'Successfully registered a new sertifikat',
      args
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getById = async (user, id) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    const result = await network.contract.submitTransaction('GetCertById', id)
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get Certificate ${id}`,
      JSON.parse(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getAllCertificate = async (user) => {
  try {
    const idPemilik = user.id
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )

    const result = await network.contract.submitTransaction(
      'getAllCertificate',
      idPemilik
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get all sertifikat`,
      bufferToJson(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getCertificateByIdPemilik = async (user, data) => {
  try {
    const idPemilik = user.id
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )

    const result = await network.contract.submitTransaction(
      'GetAllAktaByPemilik',
      idPemilik
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get sertifikat from pemilik ${idPemilik}`,
      bufferToJson(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getSertifikatHistory = async (user, data) => {
  try {
    const idSertifikat = data
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    const result = await network.contract.submitTransaction(
      'GetSertifikatHistory',
      idSertifikat
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get sertifikat history`,
      JSON.parse(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const generateIdentifier = async (user, idCertificate) => {
  try {
    var network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    const sertifikat = JSON.parse(
      await network.contract.evaluateTransaction('GetCertById', idCertificate)
    )
    console.log(sertifikat)
    network.gateway.disconnect()

    const identifier = {}
    network = await fabric.connectToNetwork(
      'badanpertanahannasional',
      'qscc',
      'admin'
    )
    const blockSertifikat = await network.contract.evaluateTransaction(
      'GetBlockByTxID',
      'bpnchannel',
      sertifikat.TxId[sertifikat.TxId.length - 1]
    )

    identifier.sertifikat = fabric.calculateBlockHash(
      BlockDecoder.decode(blockSertifikat).header
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      'Successfully get Identifier',
      identifier
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'something wrong', error.message)
  }
}

const verify = async (user, identifier) => {
  try {
    // find block that block hash == identifier
    const network = await fabric.connectToNetwork(
      'badanpertanahannasional',
      'qscc',
      'admin'
    )
    const blockSertifikat = await network.contract.evaluateTransaction(
      'GetBlockByHash',
      'bpnchannel',
      Buffer.from(identifier.sertifikat, 'hex')
    )

    // Get data from block
    const blockData = BlockDecoder.decode(blockSertifikat).data.data

    let certificateIndex = -1 // Initialize index for certificate object
    let certificateID = null // Initialize certificate ID variable

    // Iterate through transactions in the block
    for (let i = 0; i < blockData.length; i++) {
      const transaction = blockData[i]

      // Check if the transaction contains the certificate object
      if (
        transaction.payload &&
        transaction.payload.data &&
        transaction.payload.data.actions
      ) {
        const actions = transaction.payload.data.actions

        for (let j = 0; j < actions.length; j++) {
          const action = actions[j]

          // Check if the action payload contains the certificate ID
          if (
            action.payload &&
            action.payload.chaincode_proposal_payload &&
            action.payload.chaincode_proposal_payload.input &&
            action.payload.chaincode_proposal_payload.input.chaincode_spec &&
            action.payload.chaincode_proposal_payload.input.chaincode_spec
              .input &&
            action.payload.chaincode_proposal_payload.input.chaincode_spec.input
              .args
          ) {
            const args =
              action.payload.chaincode_proposal_payload.input.chaincode_spec
                .input.args

            // Assuming the certificate ID is always at a specific index
            if (args.length > 1) {
              const id = Buffer.from(args[1]).toString()

              // Check if this is the latest certificate ID
              if (certificateIndex === -1 || i > certificateIndex) {
                certificateIndex = i
                certificateID = id
              }
            }
          }
        }
      }
    }

    const idSertifikat = JSON.parse(certificateID).dokumen.idSertifikat

    //query data ijazah, transkrip, nilai
    network.gateway.disconnect()

    const certNetwork = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    const cert = await certNetwork.contract.evaluateTransaction(
      'GetCertById',
      idSertifikat
    )
    certNetwork.gateway.disconnect()

    const parseData = JSON.parse(cert)

    parseData.signatures = await fabric.getAllSignature(parseData.TxId)
    const data = {
      sertifikat: parseData,
    }

    const result = {
      success: true,
      message: 'Sertifikat asli',
      data: data,
    }
    return iResp.buildSuccessResponse(
      200,
      'Successfully get Sertifikat',
      result
    )
  } catch (error) {
    console.log('ERROR', error)
    const result = {
      success: true,
      message: 'Sertifikat tidak valid.',
    }
    return iResp.buildErrorResponse(500, 'Something wrong', result)
  }
}

const update = async (user, args) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'certcontract',
      user.username
    )
    await network.contract.submitTransaction(
      'UpdateSertifikat',
      JSON.stringify(args)
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponseWithoutData(
      200,
      'Successfully update Sertifikat'
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

module.exports = {
  getAllCertificate,
  getCertificateByIdPemilik,
  getById,
  create,
  generateIdentifier,
  getSertifikatHistory,
  verify,
  update,
}
