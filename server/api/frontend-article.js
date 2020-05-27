const mongoose = require('../mongoose')
const Article = mongoose.model('Article')

// const marked = require('marked')
// const hljs = require('highlight.js')
// marked.setOptions({
//     highlight(code) {
//         return hljs.highlightAuto(code).value
//     },
//     breaks: true
// })

/**
 * 前台浏览时, 获取文章列表
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    const { by, id, key } = ctx.query
    let { limit, page } = ctx.query
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    const data = {
            is_delete: 0
        },
        skip = (page - 1) * limit
    if (id) {
        data.category = id
    }
    if (key) {
        const reg = new RegExp(key, 'i')
        data.title = { $regex: reg }
    }
    let sort = '-update_date'
    if (by) {
        sort = '-' + by
    }

    try {
        const [list, total] = await Promise.all([Article.find(data).sort(sort).skip(skip).limit(limit).exec(), Article.countDocumentsAsync(data)])
        const totalPage = Math.ceil(total / limit)
        const user_id = ctx.cookies.get('userid') || ctx.header['userid']
        const tmpData = {
            total,
            hasNext: totalPage > page ? 1 : 0,
            hasPrev: page > 1
        }
        if (user_id) {
            const lists = list.map(item => {
                item.content = item.content.substring(0, 500) + '...'
                item._doc.like_status = item.likes.indexOf(user_id) > -1
                item.likes = []
                return item
            })
            tmpData.list = lists
            ctx.success(tmpData)
        } else {
            const lists = list.map(item => {
                item.content = item.content.substring(0, 500) + '...'
                item._doc.like_status = false
                item.likes = []
                return item
            })
            tmpData.list = lists
            ctx.success(tmpData)
        }
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

/**
 * 前台浏览时, 获取单篇文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */

exports.getItem = async ctx => {
    const _id = ctx.query.id
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    if (!_id) {
        ctx.error(null, '参数错误')
        return
    }
    try {
        const [article] = await Promise.all([Article.findOneAsync({ _id, is_delete: 0 }), Article.updateOneAsync({ _id }, { $inc: { visit: 1 } })])
        if (!article) {
            ctx.error(null, '没有找到该文章')
        } else {
            if (user_id) article._doc.like_status = article.likes.indexOf(user_id) > -1
            else article._doc.like_status = false
            article.likes = []
            ctx.success(article)
        }
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

exports.getTrending = async ctx => {
    const limit = 5
    const data = { is_delete: 0 }
    try {
        const result = await Article.find(data).sort('-visit').limit(limit).exec()
        ctx.success({
            list: result
        })
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
