const sertifikatRouter = require('express').Router()
const sertifikatController = require('../controllers/sertifikat.js')
const auth = require('../middleware/auth.js')

sertifikatRouter.get(
  '/',
  auth.verifyToken,
  sertifikatController.getAllCertificate
) // tested

sertifikatRouter.get(
  '/pemilik',
  auth.onlyUser,
  sertifikatController.getCertificateByIdPemilik
) // tested

sertifikatRouter.post(
  '/identifier/:idSertifikat',
  auth.verifyToken,
  sertifikatController.generateIdentifier
) // tested

sertifikatRouter.get(
  '/history/:idSertifikat',
  auth.verifyToken,
  sertifikatController.getSertifikatHistory
) // tested

sertifikatRouter.post('/verify', auth.verifyToken, sertifikatController.verify) // tested

sertifikatRouter.get(
  '/:idSertifikat',
  auth.verifyToken,
  sertifikatController.getById
) // tested

sertifikatRouter.post('/', auth.onlyUser, sertifikatController.create) // tested

module.exports = sertifikatRouter
