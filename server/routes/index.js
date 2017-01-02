const router = require('koa-router')()

const backend = require('./backend')
const frontend = require('./frontend')

const backendUser = require('../api/backend-user')

// 添加管理员
router.get('/backend', async ctx => {
    ctx.state = {
        title: '后台登录',
        message: ''
    }
    await ctx.render('admin-add', {})
})
router.post('/backend', backendUser.insert)

router.use('/api/backend', backend.routes(), backend.allowedMethods())
router.use('/api/frontend', frontend.routes(), frontend.allowedMethods())

module.exports = router
