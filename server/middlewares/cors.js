module.exports = async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
    ctx.set('Access-Control-Allow-Headers', 'X-Requested-With')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type')
    ctx.set('Access-Control-Allow-Headers', 'user')
    ctx.set('Access-Control-Allow-Headers', 'userid')
    ctx.set('Access-Control-Allow-Headers', 'useremail')
    ctx.set('Access-Control-Allow-Headers', 'username')
    await next()
}
