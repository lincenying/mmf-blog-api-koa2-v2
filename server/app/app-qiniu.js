// const qiniu = require('qiniu')
// const config = require('../config')

// const accessKey = config.qiniu.accessKey
// const secretKey = config.qiniu.secretKey
// const bucket = config.qiniu.bucket

exports.token = ctx => {
    // const options = {
    //     scope: bucket,
    //     expires: 60 * 60 * 24 * 1
    // }
    // try {
    //     const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    //     const putPolicy = new qiniu.rs.PutPolicy(options)
    //     const uploadToken = putPolicy.uploadToken(mac)
    //     ctx.json({ code: 200, data: uploadToken, uptoken: uploadToken })
    // } catch (error) {
    //     ctx.json({ code: -200, data: '', uptoken: '', message: error.message })
    // }
    ctx.json({ code: -200, data: '', uptoken: '', message: '' })
}
