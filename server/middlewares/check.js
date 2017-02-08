var jwt = require('jsonwebtoken')
var config = require('../config')

module.exports = (token, type) => {
    // eslint-disable-next-line
    var secret = type === 'admin' ? config.secretServer : config.secretClient
    return new Promise(resolve => {
        jwt.verify(token, secret, function(err, decoded) {
            resolve(decoded)
        })
    })
}
