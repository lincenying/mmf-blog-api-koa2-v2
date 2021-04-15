const moment = require('moment')
const mongoose = require('../mongoose')
const Category = mongoose.model('Category')
const general = require('./general')

const { item, modify, deletes, recover } = general

/**
 * 管理时, 获取分类列表
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    try {
        const result = await Category.find().sort('-cate_order').exec()
        const json = {
            code: 200,
            data: {
                list: result
            }
        }
        ctx.json(json)
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

exports.getItem = async ctx => {
    await item.call(Category, ctx)
}

exports.insert = async ctx => {
    const { cate_name, cate_order } = ctx.request.body
    if (!cate_name || !cate_order) {
        ctx.json({ code: -200, message: '请填写分类名称和排序' })
    } else {
        try {
            const result = await Category.create({
                cate_name,
                cate_order,
                creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                is_delete: 0,
                timestamp: moment().format('X')
            })
            ctx.json({ code: 200, message: '添加成功', data: result })
        } catch (err) {
            ctx.json({ code: -200, message: err.toString() })
        }
    }
}

exports.deletes = async ctx => {
    await deletes.call(Category, ctx)
}

exports.recover = async ctx => {
    await recover.call(Category, ctx)
}

exports.modify = async ctx => {
    const { id, cate_name, cate_order } = ctx.request.body
    await modify.call(Category, ctx, id, {
        cate_name,
        cate_order,
        update_date: moment().format('YYYY-MM-DD HH:mm:ss')
    })
}
