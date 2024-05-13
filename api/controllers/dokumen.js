const dokumenService = require('../services/dokumen.js')
const { v4: uuidv4 } = require('uuid')

const getById = async (req, res) => {
  const result = await dokumenService.getById(req.user, req.params.idDokumen)

  res.status(result.code).send(result)
}

const getList = async (req, res) => {
  const result = await dokumenService.getList(req.user)
  res.status(result.code).send(result)
}

const generateIdentifier = async (req, res) => {
  const data = req.params.idDokumen
  const result = await dokumenService.generateIdentifier(req.user, data)
  res.status(result.code).send(result)
}

const verify = async (req, res) => {
  const data = req.body
  const identifier = data.identifier
  const result = await dokumenService.verify(req.user, identifier)
  res.status(result.code).send(result)
}

const create = async (req, res) => {
  const data = req.body
  const args = {
    id: uuidv4(),
    idSertifikat: data.idSertifikat,
    status: data.status,
    idPembeli: req.user.id,
    idPenjual: data.idPenjual,
    approvers: [],
  }
  const result = await dokumenService.create(req.user, args)

  res.status(result.code).send(result)
}

const getDokumenByIdPembeli = async (req, res) => {
  const data = req.params.idPembeli
  const result = await dokumenService.getDokumenByIdPembeli(req.user, data)
  res.status(result.code).send(result)
}

const getDokumenByIdPenjual = async (req, res) => {
  const data = req.params.idPenjual
  const result = await dokumenService.getDokumenByIdPenjual(req.user, data)
  res.status(result.code).send(result)
}

const update = async (req, res) => {
  const data = req.body
  const args = {
    id: req.params.idDokumen,
    idSertifikat: data.idSertifikat,
    status: data.status,
    idPembeli: data.idPembeli,
    idPenjual: data.idPenjual,
    approvers: data.approvers,
  }

  const result = await dokumenService.update(req.user, args)

  res.status(result.code).send(result)
}
const approve = async (req, res) => {
  const data = req.body
  const result = await dokumenService.approve(req.user, data)
  res.status(result.code).send(result)
}

module.exports = {
  getDokumenByIdPembeli,
  getDokumenByIdPenjual,
  approve,
  getById,
  create,
  generateIdentifier,
  verify,
  getList,
  update,
}
