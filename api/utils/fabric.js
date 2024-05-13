const { Gateway, Wallets } = require('fabric-network')
const FabricCAServices = require('fabric-ca-client')
const path = require('path')
const fs = require('fs')
const sha = require('js-sha256')
const asn = require('asn1.js')
const { BlockDecoder } = require('fabric-common')
const date = require('date-and-time')
const { channelName } = require('./config')

const getCcp = (organizationName) => {
  // load the network configuration
  const ccpPath = path.resolve(
    __dirname,
    '..',
    '..',
    'network',
    'organizations',
    'peerOrganizations',
    `${organizationName.toLowerCase()}.example.com`,
    `connection-${organizationName.toLowerCase()}.json`
  )
  return JSON.parse(fs.readFileSync(ccpPath, 'utf8'))
}

const getWallet = async (org) => {
  // Create a new file system based wallet for managing identities.
  const walletPath = path.join(process.cwd(), 'wallet', org.toLowerCase())
  return await Wallets.newFileSystemWallet(walletPath)
}

const connectToNetwork = async (organizationName, chaincodeName, user) => {
  const ccp = await getCcp(organizationName)
  const wallet = await getWallet(organizationName)

  // Check to see if we've already enrolled the user.
  const identity = await wallet.get(user)
  if (!identity) {
    throw `An identity for the user ${user} does not exist in the wallet`
  }

  // Create a new gateway for connecting to our peer node.
  const gateway = new Gateway()
  await gateway.connect(ccp, {
    wallet,
    identity: user,
    discovery: { 
      enabled: true,
      asLocalhost: false
     },
    // https://stackoverflow.com/questions/56936560/why-do-i-take-more-than-2-seconds-to-just-do-a-transaction
    eventHandlerOptions: {
      strategy: null,
    },
  })

  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork(channelName)

  // Get the contract from the network.
  const contract = network.getContract(chaincodeName)

  return { gateway, network, contract }
}

const getUserAttrs = async (username, organizationName) => {
  const ccp = getCcp(organizationName)
  const wallet = await getWallet(organizationName)

  // Create a new CA client for interacting with the CA.
  const caURL =
    ccp.certificateAuthorities[`ca.${organizationName}.example.com`].url
  const ca = new FabricCAServices(caURL, undefined, `ca.${organizationName}.example.com`)

  // Check to see if we've already enrolled the admin user.
  const adminIdentity = await wallet.get('admin')
  if (!adminIdentity) {
    throw new Error('Admin network does not exist')
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type)
  const adminUser = await provider.getUserContext(adminIdentity, 'admin')

  // retrieve the registered identity
  const identityService = ca.newIdentityService()
  const userIdentity = await identityService.getOne(username, adminUser)

  // Get user attr
  const userAttrs = userIdentity.result.attrs
  return userAttrs
}

const calculateBlockHash = function (header) {
  const headerAsn = asn.define('headerAsn', function () {
    this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
      this.key('DataHash').octstr()
    )
  })

  const encodeHeader = headerAsn.encode(
    {
      Number: parseInt(header.number),
      PreviousHash: Buffer.from(header.previous_hash, 'hex'),
      DataHash: Buffer.from(header.data_hash, 'hex'),
    },
    'der'
  )

  return sha.sha256(encodeHeader)
}

const getSignature = async (txId) => {
  const network = await connectToNetwork('User', 'qscc', 'admin')
  const transaction = await network.contract.evaluateTransaction(
    'GetTransactionByID',
    channelName,
    txId
  )
  network.gateway.disconnect()

  const trEnvelope =
    BlockDecoder.decodeTransaction(transaction).transactionEnvelope
  const signature = Buffer.from(trEnvelope.signature).toString('base64')

  const time = new Date(trEnvelope.payload.header.channel_header.timestamp)
  const timeFormat = date.format(time, 'YYYY/MM/DD HH:mm:ss')

  const pubKey = Buffer.from(
    trEnvelope.payload.data.actions[0].header.creator.id_bytes
  ).toString()
  const result = {
    signature: signature,
    signTime: timeFormat,
    signerPubKey: pubKey,
  }
  return result
}

const getAllSignature = async (txIds) => {
  const lstTx = txIds
  await Promise.all(
    lstTx.map(async (item, index) => {
      lstTx[index] = await getSignature(item)
    })
  )
  return lstTx
}

module.exports = {
  getCcp,
  getWallet,
  connectToNetwork,
  getUserAttrs,
  calculateBlockHash,
  getSignature,
  getAllSignature,
}
