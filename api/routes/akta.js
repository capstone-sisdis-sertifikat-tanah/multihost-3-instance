const aktaRouter = require('express').Router()
const aktaController = require('../controllers/akta.js')
const auth = require('../middleware/auth.js')

aktaRouter.post('/approve', auth.onlyUser, aktaController.approve) // tested

aktaRouter.get(
  '/pembeli/:idPembeli',
  auth.verifyToken,
  aktaController.getAktaByIdPembeli
) // tested

aktaRouter.get(
  '/penjual/:idPenjual',
  auth.verifyToken,
  aktaController.getAktaByIdPenjual
) // tested

aktaRouter.post(
  '/identifier/:idAkta',
  auth.verifyToken,
  aktaController.generateIdentifier
)

aktaRouter.post('/verify', auth.verifyToken, aktaController.verify)

aktaRouter.get('/', auth.verifyToken, aktaController.getList) //tested

aktaRouter.get('/:idAkta', auth.verifyToken, aktaController.getById) // tested

module.exports = aktaRouter
