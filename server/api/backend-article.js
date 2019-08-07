const moment = require('moment')
const mongoose = require('../mongoose')
const Article = mongoose.model('Article')
const Category = mongoose.model('Category')
const general = require('./general')
const { list, item } = general
const marked = require('marked')
const hljs = require('highlight.js')
marked.setOptions({
    highlight(code) {
        return hljs.highlightAuto(code).value
    },
    breaks: true
})

/**
 * 管理时, 获取文章列表
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    await list(ctx, Article, '-update_date')
}

/**
 * 管理时, 获取单篇文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getItem = async ctx => {
    await item(ctx, Article)
}

/**
 * 发布文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.insert = async ctx => {
    const { category, content, title } = ctx.request.body
    const html = marked(content)
    const arr_category = category.split('|')
    const data = {
        title,
        category: arr_category[0],
        category_name: arr_category[1],
        content,
        html,
        visit: 0,
        like: 0,
        comment_count: 0,
        creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        is_delete: 0,
        timestamp: moment().format('X')
    }
    try {
        const result = await Article.createAsync(data)
        await Category.updateOneAsync({ _id: arr_category[0] }, { $inc: { cate_num: 1 } })
        ctx.success(result, '发布成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

/**
 * 管理时, 删除文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.deletes = async ctx => {
    const _id = ctx.query.id
    try {
        await Article.updateOneAsync({ _id }, { is_delete: 1 })
        await Category.updateOneAsync({ _id }, { $inc: { cate_num: -1 } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

/**
 * 管理时, 恢复文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.recover = async ctx => {
    const _id = ctx.query.id
    try {
        await Article.updateOneAsync({ _id }, { is_delete: 0 })
        await Category.updateOneAsync({ _id }, { $inc: { cate_num: 1 } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

/**
 * 管理时, 编辑文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.modify = async ctx => {
    const { id, title, category, category_name, category_old, content } = ctx.request.body
    const html = marked(content)
    const update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    try {
        const result = await Article.findOneAndUpdateAsync({ _id: id }, { category, category_name, content, html, title, update_date }, { new: true })
        if (category !== category_old) {
            await Promise.all([
                Category.updateOneAsync({ _id: category }, { $inc: { cate_num: 1 } }),
                Category.updateOneAsync({ _id: category_old }, { $inc: { cate_num: -1 } })
            ])
        }
        ctx.success(result, '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
