var jwt = require('jsonwebtoken')
var config = require('../config')
var secret = config.secret

module.exports = token => {
    // eslint-disable-next-line
    return new Promise(resolve => {
        jwt.verify(token, secret, function(err, decoded) {
            resolve(decoded)
        })
    })
}
