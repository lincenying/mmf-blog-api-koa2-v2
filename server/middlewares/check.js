const jwt = require('jsonwebtoken')
const config = require('../config')

module.exports = (token, type) => {
    // eslint-disable-next-line
    const secret = type === 'admin' ? config.secretServer : config.secretClient
    return new Promise(resolve => {
        jwt.verify(token, secret, function (err, decoded) {
            resolve(decoded)
        })
    })
}
