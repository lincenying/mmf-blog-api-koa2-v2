const mongoose = require('../mongoose')
const Article = mongoose.model('Article')

exports.like = async ctx => {
    const article_id = ctx.query.id
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    try {
        await Article.updateOne({ _id: article_id }, { $inc: { like: 1 }, $push: { likes: user_id } })
        ctx.json({ code: 200, message: '操作成功', data: 'success' })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}
exports.unlike = async ctx => {
    const article_id = ctx.query.id
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    try {
        Article.updateOne({ _id: article_id }, { $inc: { like: -1 }, $pull: { likes: user_id } })
        ctx.json({ code: 200, message: '操作成功', data: 'success' })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}
exports.resetLike = async ctx => {
    try {
        const result = await Article.find().exec()
        const length = result.length
        for (let i = 0; i < length; i++) {
            const item = result[i]
            await Article.findOneAndUpdate({ _id: item._id }, { like: item.likes.length }, { new: true })
        }
        ctx.json({ code: 200, message: '操作成功', data: 'success' })
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}
