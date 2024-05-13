const userService = require('../services/user.js')

const enrollAdmin = async (req, res) => {
  const data = req.body
  const username = data.username
  const password = data.password
  const orgName = data.organizationName

  const result = await userService.enrollAdmin(username, password, orgName)

  res.status(result.code).send(result)
}

const registerAdminBPN = async (req, res) => {
  const data = req.body
  const username = data.username
  const email = data.email

  const result = await userService.registerAdminBpn(
    username,
    email,
    'BadanPertanahanNasional',
    'admin-bpn'
  )
  res.status(result.code).send(result)
}

const registerUser = async (req, res) => {
  const data = req.body
  const result = await userService.registerUser(
    req.user,
    data.username,
    data.email,
    data.organizationName,
    data.role
  )
  res.status(result.code).send(result)
}

const loginUser = async (req, res) => {
  const data = req.body
  const username = data.username
  const password = data.password

  const result = await userService.loginUser(username, password)
  res.status(result.code).send(result)
}

const editEmail = async (req, res) => {
  const result = await userService.editEmail(req.user, req.body)
  res.status(result.code).send(result)
}

const editPassword = async (req, res) => {
  const result = await userService.editPassword(req.user, req.body)
  res.status(result.code).send(result)
}

const getAllUsers = async (req, res) => {
  const result = await userService.getAllUsers(req.user)
  res.status(result.code).send(result)
}

const getAllRoles = async (req, res) => {
  const result = await userService.getAllRoles(req.user)
  res.status(result.code).send(result)
}

module.exports = {
  enrollAdmin,
  registerAdminBPN,
  registerUser,
  loginUser,
  getAllUsers,
  getAllRoles,
  editEmail,
  editPassword,
}
