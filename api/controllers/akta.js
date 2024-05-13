const aktaService = require('../services/akta.js')
const { v4: uuidv4 } = require('uuid')

const getById = async (req, res) => {
  const result = await aktaService.getById(req.user, req.params.idAkta)

  res.status(result.code).send(result)
}

const getList = async (req, res) => {
  const result = await aktaService.getList(req.user)
  res.status(result.code).send(result)
}

const generateIdentifier = async (req, res) => {
  const data = req.params.idAkta
  const result = await aktaService.generateIdentifier(req.user, data)
  res.status(result.code).send(result)
}

const verify = async (req, res) => {
  const data = req.body
  const identifier = data.identifier
  const result = await aktaService.verify(req.user, identifier)
  res.status(result.code).send(result)
}

const create = async (req, res) => {
  const data = req.body
  const args = {
    id: uuidv4(),
    idDokumen: data.idDokumen,
    status: data.status,
    idPembeli: data.idPembeli,
    idPenjual: data.idPenjual,
    approvers: [],
  }
  const result = await aktaService.create(req.user, args)

  res.status(result.code).send(result)
}

const getAktaByIdPembeli = async (req, res) => {
  const data = req.params.idPembeli
  const result = await aktaService.getAktaByIdPembeli(req.user, data)
  res.status(result.code).send(result)
}

const getAktaByIdPenjual = async (req, res) => {
  const data = req.params.idPenjual
  const result = await aktaService.getAktaByIdPenjual(req.user, data)
  res.status(result.code).send(result)
}

const update = async (req, res) => {
  const data = req.body
  const args = {
    id: req.params.idAkta,
    idDokumen: data.idDokumen,
    status: data.status,
    idPemilik: data.idPemilik,
    idPenjual: data.idPenjual,
    approvers: data.approvers,
  }

  const result = await aktaService.update(req.user, args)

  res.status(result.code).send(result)
}
const approve = async (req, res) => {
  const data = req.body
  const result = await aktaService.approve(req.user, data)
  res.status(result.code).send(result)
}

module.exports = {
  getAktaByIdPembeli,
  getAktaByIdPenjual,
  approve,
  getById,
  create,
  generateIdentifier,
  verify,
  update,
  getList,
}
