var moment = require('moment')

var mongoose = require('../mongoose')
var Comment = mongoose.model('Comment')
var Article = mongoose.model('Article')

/**
 * 发布评论
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.insert = async ctx => {
    var content = ctx.request.body.content,
        creat_date = moment().format('YYYY-MM-DD HH:MM:SS'),
        id = ctx.request.body.id,
        timestamp = moment().format('X'),
        userid = ctx.cookies.get('userid'),
        username = ctx.cookies.get('username')
    username = new Buffer(username, 'base64').toString()
    if (!id) {
        ctx.error('参数错误')
        return
    } else if (!content) {
        ctx.error('请输入评论内容')
        return
    }
    var data = {
        article_id: id,
        userid,
        username,
        email: '',
        content,
        creat_date,
        is_delete: 0,
        timestamp
    }
    try {
        const result = await Comment.createAsync(data)
        await Article.updateAsync({ _id: id }, { '$inc':{ 'comment_count': 1 } })
        ctx.success(result)
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 前台浏览时, 读取评论列表
 * @method
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    var all = ctx.query.all,
        id = ctx.query.id,
        limit = ctx.query.limit,
        page = ctx.query.page
    if (!id) {
        ctx.error('参数错误')
    } else {
        page = parseInt(page, 10)
        limit = parseInt(limit, 10)
        if (!page) page = 1
        if (!limit) limit = 10
        var data = {
                article_id: id
            },
            skip = (page - 1) * limit
        if (!all) {
            data.is_delete = 0
        }
        try {
            const [list, total] = await Promise.all([
                Comment.find(data).sort('-_id').skip(skip).limit(limit).exec(),
                Comment.countAsync(data)
            ])
            var totalPage = Math.ceil(total / limit)
            ctx.success({
                list,
                total,
                hasNext: totalPage > page ? 1 : 0
            })
        } catch (err) {
            ctx.error(err.toString())
        }
    }
}

/**
 * 评论删除
 * @method deleteAdmin
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.deletes = async ctx => {
    var id = ctx.query.id
    try {
        await Comment.updateAsync({ _id: id }, { is_delete: 1 })
        await Article.updateAsync({ _id: id }, { '$inc': { 'comment_count': -1 } })
        ctx.success('success', '删除成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 评论恢复
 * @method deleteAdmin
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.recover = async ctx => {
    var id = ctx.query.id
    try {
        await Comment.updateAsync({ _id: id }, { is_delete: 0 })
        await Article.updateAsync({ _id: id }, { '$inc': { 'comment_count': 1 } })
        ctx.success('success', '恢复成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}
