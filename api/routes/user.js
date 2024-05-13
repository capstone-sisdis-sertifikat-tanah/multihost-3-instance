const userRouter = require('express').Router()
const userController = require('../controllers/user.js')
const auth = require('../middleware/auth.js')

userRouter.post(
  '/user/register',
  auth.onlyAdminBPN,
  userController.registerUser
)

userRouter.post('/admin-bpn/register', userController.registerAdminBPN)

userRouter.post('/enroll', userController.enrollAdmin)
userRouter.post('/login', userController.loginUser)

userRouter.get('/list/users', auth.verifyToken, userController.getAllUsers)

userRouter.get('/list/all-roles', auth.onlyAdminBPN, userController.getAllRoles)

userRouter.post('/edit/email', auth.verifyToken, userController.editEmail)

userRouter.post('/edit/password', auth.verifyToken, userController.editPassword)

module.exports = userRouter
