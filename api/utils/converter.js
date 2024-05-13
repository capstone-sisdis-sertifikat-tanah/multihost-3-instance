// const dataService = require('../services/data.js')

// const getParser = async (result, query = [true, true]) => {
//   if (query[0] && result.idSp) {
//     const id = result.idSp
//     const data = await dataService.getPTById('admin', id)
//     result.sp = {
//       id: id,
//       nama: data.namaSp,
//     }
//     delete result.idSp
//   }

//   if (query[1] && result.idSms) {
//     const id = result.idSms
//     const data = await dataService.getProdiById('admin', id)
//     result.sms = data
//     delete result.idSms
//   }
//   return result
// }

const bufferToJson = (data) => {
  if (data.toJSON().data.length === 0) {
    return []
  }

  return JSON.parse(data)
}

module.exports = {
  // getParser,
  bufferToJson,
}
