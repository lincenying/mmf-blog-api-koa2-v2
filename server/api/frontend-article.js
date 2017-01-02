var mongoose = require('../mongoose')
var Article = mongoose.model('Article')
var Like = mongoose.model('Like')

// var marked = require('marked')
// var hljs = require('highlight.js')
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
    var by = ctx.query.by,
        id = ctx.query.id,
        key = ctx.query.key,
        limit = ctx.query.limit,
        page = ctx.query.page
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    var data = {
            is_delete: 0
        },
        skip = (page - 1) * limit
    if (id) {
        data.category = id
    }
    if (key) {
        var reg = new RegExp(key, 'i')
        data.title = {$regex : reg}
    }
    var sort = '-_id'
    if (by) {
        sort = '-' + by
    }

    try {
        var [lists, total] = await Promise.all([
            Article.find(data).sort(sort).skip(skip).limit(limit).exec(),
            Article.countAsync(data)
        ])
        var arr = [],
            totalPage = Math.ceil(total / limit),
            user_id = ctx.cookies.get('userid')
        var tmpData = {
            list: lists,
            total,
            hasNext: totalPage > page ? 1 : 0,
            hasPrev: page > 1
        }
        if (user_id) {
            lists.forEach(item => {
                arr.push(Like.findOneAsync({ article_id: item._id, user_id }))
            })
            const collection = await Promise.all(arr)
            lists = lists.map((item, index) => {
                item._doc.like_status = !!collection[index]
                return item
            })
            tmpData.list = lists
            ctx.success(tmpData)
        } else {
            lists = lists.map(item => {
                item._doc.like_status = false
                return item
            })
            tmpData.list = lists
            ctx.success(tmpData)
        }
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 前台浏览时, 获取单篇文章
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */

exports.getItem = async ctx => {
    var _id = ctx.query.id,
        user_id = ctx.cookies.get('userid')
    if (!_id) {
        ctx.error('参数错误')
        return
    }
    try {
        const [article, like, ] = await Promise.all([
            Article.findOneAsync({ _id, is_delete: 0 }),
            Like.findOneAsync({ article_id: _id, user_id }),
            Article.updateAsync({ _id }, { '$inc':{ 'visit': 1 } })
        ])
        if (!article) {
            ctx.error('没有找到该文章')
        } else {
            if (user_id) article._doc.like_status = !! like
            else article._doc.like_status = false
            ctx.success(article)
        }
    } catch (err) {
        ctx.error(err.toString())
    }
}

exports.getTrending = async ctx => {
    var limit = 5
    var data = { is_delete: 0 }
    try {
        const result = await Article.find(data).sort('-visit').limit(limit).exec()
        ctx.success({
            list: result
        })
    } catch (err) {
        ctx.error(err.toString())
    }
}
