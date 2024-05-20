const bufferToJson = (data) => {
  if (data.toJSON().data.length === 0) {
    return []
  }

  return JSON.parse(data)
}

module.exports = {
  bufferToJson,
}
