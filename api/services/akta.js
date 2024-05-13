const iResp = require('../utils/response.interface.js')
const fabric = require('../utils/fabric.js')
const { BlockDecoder } = require('fabric-common')
const { bufferToJson } = require('../utils/converter.js')

const create = async (user, args) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    await network.contract.submitTransaction('CreateAKTA', JSON.stringify(args))
    network.gateway.disconnect()
    return iResp.buildSuccessResponseWithoutData(
      200,
      'Successfully registered a new Akta'
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getById = async (user, id) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    const result = await network.contract.submitTransaction('GetAktaById', id)
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get Akta ${id}`,
      JSON.parse(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getAktaByIdPembeli = async (user, data) => {
  try {
    const idPembeli = data
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )

    const result = await network.contract.submitTransaction(
      'GetAllAktaByPembeli',
      idPembeli
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get akta by id pembeli: ${idPembeli}`,
      bufferToJson(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}
const getAktaByIdPenjual = async (user, data) => {
  try {
    const idPenjual = data
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )

    const result = await network.contract.submitTransaction(
      'GetAllAktaByPenjual',
      idPenjual
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      `Successfully get akta by id penjual: ${idPenjual}`,
      bufferToJson(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const generateIdentifier = async (user, idAkta) => {
  try {
    var network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    const akta = JSON.parse(
      await network.contract.evaluateTransaction('GetAktaById', idAkta)
    )

    network.gateway.disconnect()

    const identifier = {}
    network = await fabric.connectToNetwork(
      'badanpertanahannasional',
      'qscc',
      'admin'
    )

    const blockAkta = await network.contract.evaluateTransaction(
      'GetBlockByTxID',
      'bpnchannel',
      akta.TxId[akta.TxId.length - 1]
    )

    identifier.akta = fabric.calculateBlockHash(
      BlockDecoder.decode(blockAkta).header
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
    const blockAkta = await network.contract.evaluateTransaction(
      'GetBlockByHash',
      'bpnchannel',
      Buffer.from(identifier.akta, 'hex')
    )

    // Get data from block
    const argsAkta =
      BlockDecoder.decode(blockAkta).data.data[0].payload.data.actions[0]
        .payload.chaincode_proposal_payload.input.chaincode_spec.input.args
    const idAkta = Buffer.from(argsAkta[1]).toString()

    //query data ijazah, transkrip, nilai
    network.gateway.disconnect()

    const aktaNetwork = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    const akta = await aktaNetwork.contract.evaluateTransaction(
      'GetAktaById',
      idAkta
    )
    aktaNetwork.gateway.disconnect()
    const parseData = JSON.parse(akta)

    parseData.signatures = await fabric.getAllSignature(parseData.TxId)
    const data = {
      akta: parseData,
    }

    const result = {
      success: true,
      message: 'Akta asli',
      data: data,
    }
    return iResp.buildSuccessResponse(200, 'Successfully get Akta', result)
  } catch (error) {
    const result = {
      success: true,
      message: 'Akta tidak valid.',
    }
    return iResp.buildErrorResponse(500, 'Something wrong', result)
  }
}

const approve = async (user, args) => {
  const idApproval = user.id
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )

    const result = JSON.parse(
      await network.contract.submitTransaction('GetAktaById', args.id)
    )

    if (
      result.status === 'Menunggu Persetujuan Penjual' &&
      user.id === result.penjual.id
    ) {
      if (args.status === 'approve') {
        result.status = 'Menunggu Persetujuan Pembeli'
        result.approvers.push(idApproval)
      } else if (args.status === 'reject') {
        result.status = 'reject'
      }
    } else if (
      result.status === 'Menunggu Persetujuan Pembeli' &&
      user.id === result.pembeli.id
    ) {
      if (args.status === 'approve') {
        result.status = 'Approve'
        result.approvers.push(idApproval)

        // Update Akta Tanah 1x Transaction

        const sertifikatNetwork = await fabric.connectToNetwork(
          user.organizationName,
          'certcontract',
          user.username
        )
        const userNetwork = await fabric.connectToNetwork(
          user.organizationName,
          'usercontract',
          user.username
        )
        const dokumenNetwork = await fabric.connectToNetwork(
          user.organizationName,
          'dokcontract',
          user.username
        )

        // Get All Dokumen, Sertifikat, User
        const dokumen = JSON.parse(
          await dokumenNetwork.contract.submitTransaction(
            'GetDokById',
            result.dokumen.id
          )
        )

        const sertifikat = JSON.parse(
          await sertifikatNetwork.contract.submitTransaction(
            'GetCertById',
            dokumen.sertifikat.id
          )
        )

        const userFetch = JSON.parse(
          await userNetwork.contract.submitTransaction(
            'GetUserById',
            result.pembeli.id
          )
        )

        // Update Dokumen dan Akta yang sudah tidak berlaku
        if (sertifikat.akta) {
          const aktaLama = JSON.parse(
            await network.contract.submitTransaction(
              'GetAktaById',
              sertifikat.akta.id
            )
          )
          aktaLama.status = 'Sudah Tidak Berlaku'
          await network.contract.submitTransaction(
            'UpdateAkta',
            JSON.stringify(aktaLama)
          )

          const dokumenLama = JSON.parse(
            await dokumenNetwork.contract.submitTransaction(
              'GetDokById',
              aktaLama.dokumen.id
            )
          )
          dokumenLama.status = 'Sudah Tidak Berlaku'
          await dokumenNetwork.contract.submitTransaction(
            'UpdateDok',
            JSON.stringify(dokumen)
          )
        }

        // Update Sertifikat

        sertifikat.pemilik = userFetch
        sertifikat.akta = result

        await sertifikatNetwork.contract.submitTransaction(
          'UpdateSertifikat',
          JSON.stringify(sertifikat)
        )

        userNetwork.gateway.disconnect()
        sertifikatNetwork.gateway.disconnect()
        dokumenNetwork.gateway.disconnect()
      } else if (args.status === 'reject') {
        result.status = 'reject'
      }
    } else if (result.status === 'reject') {
      return iResp.buildSuccessResponseWithoutData(200, 'Akta Telah ditolak')
    } else if (user.id !== result.pembeli.id || user.id === result.penjual.id) {
      return iResp.buildSuccessResponseWithoutData(
        200,
        'Anda Tidak Dapat Memberikan Approval'
      )
    }
    await network.contract.submitTransaction(
      'UpdateAkta',
      JSON.stringify(result)
    )
    network.gateway.disconnect()
    return iResp.buildSuccessResponseWithoutData(
      200,
      'Successfully Approve Akta'
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const getList = async (user) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    const result = await network.contract.submitTransaction('ReadAllAkta')
    network.gateway.disconnect()
    return iResp.buildSuccessResponse(
      200,
      'Successfully get all Akta',
      bufferToJson(result)
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

const update = async (user, args) => {
  try {
    const network = await fabric.connectToNetwork(
      user.organizationName,
      'aktacontract',
      user.username
    )
    await network.contract.submitTransaction('UpdateAkta', JSON.stringify(args))
    network.gateway.disconnect()
    return iResp.buildSuccessResponseWithoutData(
      200,
      'Successfully update Akta'
    )
  } catch (error) {
    return iResp.buildErrorResponse(500, 'Something wrong', error.message)
  }
}

module.exports = {
  getAktaByIdPembeli,
  getAktaByIdPenjual,
  getById,
  create,
  generateIdentifier,
  verify,
  approve,
  update,
  getList,
}
