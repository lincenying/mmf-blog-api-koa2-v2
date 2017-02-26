var check = require('./check')

module.exports = async (ctx, next) => {
    var token = ctx.cookies.get('b_user'),
        userid = ctx.cookies.get('b_userid'),
        username = ctx.cookies.get('b_username') || ''
    username = new Buffer(username, 'base64').toString()
    if (token) {
        const decoded = await check(token, 'admin')
        if (decoded && decoded.id === userid && decoded.username === username) {
            ctx.decoded = decoded
            await next()
        } else {
            ctx.body = {
                code: -500,
                message: '登录验证失败',
                data: ''
            }
        }
    } else {
        ctx.body = {
            code: -500,
            message: '请先登录',
            data: ''
        }
    }
}
