module.exports = async (ctx, next) => {
    ctx.error = (message, data = '') => {
        ctx.body = {
            code: -200,
            message,
            data,
        }
    }
    ctx.success = (data, message = '') => {
        ctx.body = {
            code: 200,
            message,
            data,
        }
    }
    await next()
}
