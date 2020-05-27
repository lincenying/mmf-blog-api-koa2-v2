const path = require('path')
const Koa = require('koa')
const router = require('koa-router')()
const views = require('koa-views')
const convert = require('koa-convert')
const json = require('koa-json')
const bodyparser = require('koa-bodyparser')()
const logger = require('koa-logger')
const proxy = require('./server/middlewares/proxy')

// 引入 mongoose 相关模型
require('./server/models/admin')
require('./server/models/article')
require('./server/models/category')
require('./server/models/comment')
require('./server/models/user')
require('./server/models/shihua')

const index = require('./server/routes/index')

const app = new Koa()
// middlewares
app.use(convert(bodyparser))
app.use(convert(json()))
app.use(convert(logger()))
app.use(convert(require('koa-static')(path.join(__dirname, 'public'))))

app.use(views(path.join(__dirname, 'views'), { extension: 'ejs' }))

app.use(require('./server/middlewares/return'))

app.use(proxy(app))

app.use(index.routes(), router.allowedMethods())

app.on('error', function (err, ctx) {
    console.error('server error', err, ctx)
})

module.exports = app
