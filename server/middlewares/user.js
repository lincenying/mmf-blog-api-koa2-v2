const check = require('./check')

module.exports = async (ctx, next) => {
    const token = ctx.cookies.get('user') || ctx.header['user']
    const userid = ctx.cookies.get('userid') || ctx.header['userid']
    let username = ctx.cookies.get('username') || ctx.header['username'] || ''
    username = new Buffer(username, 'base64').toString()
    if (token) {
        const decoded = await check(token, 'user')
        if (decoded && decoded.id === userid && decoded.username === username) {
            ctx.decoded = decoded
            await next()
        } else {
            ctx.cookies.set('user', '', { maxAge: 0, httpOnly: false })
            ctx.cookies.set('userid', '', { maxAge: 0 })
            ctx.cookies.set('username', '', { maxAge: 0 })
            ctx.cookies.set('useremail', '', { maxAge: 0 })
            ctx.body = {
                code: -400,
                message: '登录验证失败',
                data: ''
            }
        }
    } else {
        ctx.body = {
            code: -400,
            message: '请先登录',
            data: ''
        }
    }
}
