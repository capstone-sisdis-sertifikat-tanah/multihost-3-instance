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
    const result = JSON.parse(
      await network.contract.submitTransaction('GetCertById', id)
    )

    const isApproved = result.akta?.status === 'Approve'
    const signatures = isApproved
      ? await fabric.getAllSignature(result.TxId)
      : null

    const resultWithSignatures = {
      ...result,
      signatures,
    }
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get Certificate ${id}`,
      resultWithSignatures
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
    network.gateway.disconnect()

    const identifier = {}
    network = await fabric.connectToNetwork(
      'bpn',
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

    function getSertifikatAndAktaIdFromBlock(blockData) {
      const [found] = BlockDecoder.decode(blockData).data.data.filter((obj) => {
        const item =
          obj.payload.data.actions[0].payload.chaincode_proposal_payload.input
            .chaincode_spec.input.args
        const jsonString = Buffer.from(item[1]).toString()

        const isJsonString = jsonString.includes('{')

        const toCheck = isJsonString ? JSON.parse(jsonString) : jsonString

        if (typeof toCheck === 'object' && toCheck.hasOwnProperty('lokasi')) {
          return true
        }

        return false
      })

      const item =
        found.payload.data.actions[0].payload.chaincode_proposal_payload.input
          .chaincode_spec.input.args

      const sertifikat = JSON.parse(Buffer.from(item[1]).toString())

      return {
        idSertifikat: sertifikat.id,
        idAkta: sertifikat.akta.id,
      }
    }

    const { idSertifikat, idAkta } =
      getSertifikatAndAktaIdFromBlock(blockSertifikat)

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

    if (parseData.akta.id !== idAkta) {
      throw new Error('akta-error')
    }

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
    console.log(error)
    const isAktaError = error.message === 'akta-error'
    const result = {
      success: true,
      message: isAktaError
        ? 'Akta jual beli sertifikat sudah tidak berlaku'
        : 'Identifier tidak valid.',
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
