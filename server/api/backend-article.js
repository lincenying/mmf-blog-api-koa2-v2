var moment = require('moment')
var mongoose = require('../mongoose')
var Article = mongoose.model('Article')
var Category = mongoose.model('Category')
const general = require('./general')

const list = general.list
const item = general.item

var marked = require('marked')
var hljs = require('highlight.js')
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
    await list(ctx, Article)
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
    var categorys = ctx.request.body.category,
        content = ctx.request.body.content,
        html = marked(content),
        title = ctx.request.body.title
    var arr_category = categorys.split("|")
    var category = arr_category[0]
    var category_name = arr_category[1]
    var data = {
        title,
        category,
        category_name,
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
        await Category.updateAsync({ _id: category }, { '$inc': { 'cate_num': 1 } })
        ctx.success(result, '发布成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 管理时, 删除文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.deletes = async ctx => {
    var id = ctx.query.id
    try {
        await Article.updateAsync({ _id: id }, { is_delete: 1 })
        await Category.updateAsync({ _id: id }, { '$inc': { 'cate_num': -1 } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 管理时, 恢复文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.recover = async ctx => {
    var id = ctx.query.id
    try {
        await Article.updateAsync({ _id: id }, { is_delete: 0 })
        await Category.updateAsync({ _id: id }, { '$inc': { 'cate_num': 1 } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 管理时, 编辑文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.modify = async ctx => {
    var category = ctx.request.body.category,
        category_name = ctx.request.body.category_name,
        category_old = ctx.request.body.category_old,
        content = ctx.request.body.content,
        html = marked(content),
        id = ctx.request.body.id,
        title = ctx.request.body.title,
        update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    try {
        await Article.updateAsync({ _id: id }, { '$set': { category, category_name, content, html, title, update_date } })
        if (category !== category_old) {
            await Promise.all([
                Category.updateAsync({ _id: category }, { '$inc': { 'cate_num': 1 } }),
                Category.updateAsync({ _id: category_old }, { '$inc': { 'cate_num': -1 } })
            ])
        }
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}
