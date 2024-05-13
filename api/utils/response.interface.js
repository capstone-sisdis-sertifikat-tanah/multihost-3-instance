exports.buildSuccessResponse = (code, message, data, error = null) => {
  return {
    success: true,
    code: code,
    message: message,
    data: data,
    error: error,
  }
}

exports.buildSuccessResponseWithoutData = (
  code,
  message,
  data = null,
  error = null
) => {
  return {
    success: true,
    code: code,
    message: message,
    data: data,
    error: error,
  }
}

exports.buildErrorResponse = (code, message, error) => {
  return {
    success: false,
    code: code,
    message: message,
    data: null,
    error: error,
  }
}

exports.buildErrorResponseWithData = (code, message, data, error) => {
  return {
    success: false,
    code: code,
    message: message,
    data: data,
    error: error,
  }
}
