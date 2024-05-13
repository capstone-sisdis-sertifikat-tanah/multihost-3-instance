const router = require('express').Router()

const userRouter = require('./user.js')
const dokumenRouter = require('./dokumen.js')
const aktaRouter = require('./akta.js')
const sertifikatRouter = require('./sertifikat.js')

router.use('/auth', userRouter)
router.use('/dokumen', dokumenRouter)
router.use('/akta', aktaRouter)
router.use('/sertifikat', sertifikatRouter)

module.exports = router
