'use strict'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Service()

const request       = require('request')
const isEmpty       = require('lodash.isempty')
const isPlainObject = require('lodash.isplainobject')

_plugin.on('data', (data) => {
  if (!isPlainObject(data)) {
    return _plugin.logException(new Error(`Invalid data received. Must be a valid JSON Object. Data: ${data}`))
  }

  if (isEmpty(data) || isEmpty(data.faceId1) || isEmpty(data.faceId2)) {
    return _plugin.logException(new Error('Invalid data received. Data must contain 2 face ids for comparison.'))
  }

  request.post({
    url: _plugin.config.faceAPIEndPoint,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': _plugin.config.apiKey
    },
    body: JSON.stringify(data)
  }, (error, response, body) => {
    if (error) {
      _plugin.logException(error)
    }
    else if (response.statusCode !== 200) {
      let errorMessage = '';

      try {
        errorMessage = JSON.parse(body).error.message
      }
      catch (error) {
      }
      _plugin.logException(new Error(`HTTP ${response.statusCode}: ${errorMessage}`))
    }
    else {
      try {
        let responseBody = JSON.parse(body)
        console.log(responseBody)

        _plugin.pipe(data, responseBody)
          .then(() => {
            _plugin.log(JSON.stringify({
              title: 'Processed data using Face Verification Service',
              data: data,
              result: responseBody
            }))
          })
          .catch((err) => {
            _plugin.logException(err)
          })
      }
      catch (error) {
        _plugin.logException(error)
      }
    }
  })
})

_plugin.once('ready', () => {
  _plugin.log('Face Verification Service has been initialized.')
  _plugin.emit('init')
})

module.exports = _plugin