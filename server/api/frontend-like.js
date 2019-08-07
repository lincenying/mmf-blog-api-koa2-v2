const mongoose = require('../mongoose')
const Article = mongoose.model('Article')

exports.like = async ctx => {
    const article_id = ctx.query.id
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    try {
        await Article.updateOneAsync({ _id: article_id }, { $inc: { like: 1 }, $push: { likes: user_id } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
exports.unlike = async ctx => {
    const article_id = ctx.query.id
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    try {
        await Article.updateOneAsync({ _id: article_id }, { $inc: { like: -1 }, $pull: { likes: user_id } })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
exports.resetLike = async ctx => {
    try {
        const result = await Article.find().exec()
        result.forEach(item => {
            Article.findOneAndUpdateAsync({ _id: item._id }, { like: item.likes.length }, { new: true })
        })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}
