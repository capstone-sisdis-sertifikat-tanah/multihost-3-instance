const dokumenRouter = require('express').Router()
const dokumenController = require('../controllers/dokumen.js')
const auth = require('../middleware/auth.js')

dokumenRouter.post(
  '/approve',
  auth.onlyBankAndNotaris,
  dokumenController.approve
) //tested

dokumenRouter.get(
  '/pembeli/:idPembeli',
  auth.verifyToken,
  dokumenController.getDokumenByIdPembeli
) //tested

dokumenRouter.get(
  '/penjual/:idPenjual',
  auth.verifyToken,
  dokumenController.getDokumenByIdPenjual
) //tested

dokumenRouter.post(
  '/identifier/:idDokumen',
  auth.verifyToken,
  dokumenController.generateIdentifier
) // tested

dokumenRouter.post('/verify', auth.verifyToken, dokumenController.verify) // tested

dokumenRouter.get('/:idDokumen', auth.verifyToken, dokumenController.getById) //tested

dokumenRouter.post('/', auth.onlyUser, dokumenController.create) //tested

dokumenRouter.get('/', auth.verifyToken, dokumenController.getList) //tested

dokumenRouter.put('/', auth.verifyToken, dokumenController.update) //tested

module.exports = dokumenRouter
