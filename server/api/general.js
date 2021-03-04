/**
 * 通用列表
 * @method list
 * @param  {[type]} ctx     [description]
 * @param  {[type]} mongoDB [description]
 * @param  {[type]} sort    排序
 * @return {[type]}         [description]
 */
exports.list = async function (ctx, sort) {
    let { limit, page } = ctx.query
    sort = sort || '-_id'
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    const skip = (page - 1) * limit
    try {
        const result = await Promise.all([this.find().sort(sort).skip(skip).limit(limit).exec(), this.countDocuments()])
        const total = result[1]
        const totalPage = Math.ceil(total / limit)
        const json = {
            code: 200,
            data: {
                list: result[0],
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1 ? 1 : 0
            }
        }
        ctx.json(json)
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 通用单个
 * @method item
 * @param  {[type]} ctx     [description]
 * @param  {[type]} mongoDB [description]
 * @return {[type]}         [description]
 */
exports.item = async function (ctx) {
    const _id = ctx.query.id
    if (!_id) {
        ctx.json({ code: -200, message: '参数错误' })
        return
    }
    try {
        const result = await this.findOne({ _id })
        ctx.json({ code: 200, data: result })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 通用删除
 * @method deletes
 * @param  {[type]} ctx     [description]
 * @param  {[type]} mongoDB [description]
 * @return {[type]}         [description]
 */
exports.deletes = async function (ctx) {
    const _id = ctx.query.id
    try {
        await this.updateOne({ _id }, { is_delete: 1 })
        ctx.json({ code: 200, message: '更新成功', data: 'success' })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 通用编辑
 * @method modify
 * @param  {[type]} ctx     [description]
 * @param  {[type]} mongoDB [description]
 * @param  {[type]} _id     [description]
 * @param  {[type]} data    [description]
 * @return {[type]}         [description]
 */
exports.modify = async function (ctx, _id, data) {
    try {
        const result = await this.findOneAndUpdate({ _id }, data, { new: true })
        ctx.json({ code: 200, message: '更新成功', data: result })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 通用编辑
 * @method recover
 * @param  {[type]} ctx     [description]
 * @param  {[type]} mongoDB [description]
 * @return {[type]}         [description]
 */
exports.recover = async function (ctx) {
    const _id = ctx.query.id
    try {
        await this.updateOne({ _id }, { is_delete: 0 })
        ctx.json({ code: 200, message: '更新成功', data: 'success' })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}
