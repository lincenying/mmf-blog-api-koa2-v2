exports.getProxyList = async ctx => {
    try {
        const xhr = await ctx.proxy('https://cnodejs.org/api/v1/topics')
        const body = xhr && xhr.body && xhr.body.body
        if (body) {
            ctx.success(body.data)
        } else {
            ctx.error(null, '没有抓取到数据')
        }
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
