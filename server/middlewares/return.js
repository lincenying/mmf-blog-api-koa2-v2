module.exports = async (ctx, next) => {
    ctx.error = (data, message, other = {}) => {
        ctx.body = {
            code: -200,
            message,
            data,
            ...other
        }
    }
    ctx.success = (data, message = '', other = {}) => {
        ctx.body = {
            code: 200,
            message,
            data,
            ...other
        }
    }
    await next()
}
