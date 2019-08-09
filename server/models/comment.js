const mongoose = require('../mongoose')
const Schema = mongoose.Schema
const Promise = require('bluebird')
const mongooseAutopopulate = require('mongoose-autopopulate')

const CommentSchema = new Schema({
    article_id: String,
    userid: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: { select: '_id email username' } },
    content: String,
    creat_date: String,
    is_delete: Number,
    timestamp: Number
})

const Comment = mongoose.model('Comment', CommentSchema)
CommentSchema.plugin(mongooseAutopopulate)
Promise.promisifyAll(Comment)
Promise.promisifyAll(Comment.prototype)

module.exports = Comment
