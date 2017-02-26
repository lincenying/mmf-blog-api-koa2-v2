var moment = require('moment')
var mongoose = require('../mongoose')
var Article = mongoose.model('Article')
var Like = mongoose.model('Like')

exports.like = async ctx => {
    var article_id = ctx.query.id
    var user_id = ctx.cookies.get('userid')
    var data = {
        article_id,
        user_id,
        creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        timestamp: moment().format('X'),
        update_date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    try {
        const result = await Like.findOneAsync({ article_id, user_id })
        if (result) {
            ctx.error('你已经赞过了')
        } else {
            await Like.createAsync(data)
            await Article.updateAsync({ _id: article_id }, { '$inc': { 'like': 1 } })
            ctx.success('success', '更新成功')
        }
    } catch (err) {
        ctx.error(err.toString())
    }
}

exports.unlike = async ctx => {
    var article_id = ctx.query.id
    var user_id = ctx.cookies.get('userid')
    try {
        await Like.removeAsync({ article_id, user_id })
        await Article.updateAsync({ _id: article_id }, { '$inc': { 'like': -1 } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(err.toString())
    }
}
