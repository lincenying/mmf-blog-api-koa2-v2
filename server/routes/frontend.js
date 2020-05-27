const router = require('koa-router')()

const frontendArticle = require('../api/frontend-article')
const frontendComment = require('../api/frontend-comment')
const frontendLike = require('../api/frontend-like')
const frontendUser = require('../api/frontend-user')
const frontendProxy = require('../api/proxy')
const isUser = require('../middlewares/user')

// API
// ================= 前台 =================
// ------ 文章 ------
// 前台浏览时, 获取文章列表
router.get('/article/list', frontendArticle.getList)
// 前台浏览时, 获取单篇文章
router.get('/article/item', frontendArticle.getItem)
// 前台浏览时, 热门文章
router.get('/trending', frontendArticle.getTrending)
// ------ 评论 ------
// 发布评论
router.post('/comment/insert', isUser, frontendComment.insert)
// 读取评论列表
router.get('/comment/list', frontendComment.getList)
// ------ 用户 ------
// 前台注册
router.post('/user/insert', frontendUser.insert)
// 前台登录
router.post('/user/login', frontendUser.login)
// 微信登录
router.post('/user/jscode2session', frontendUser.jscode2session)
router.post('/user/wxLogin', frontendUser.wxLogin)
// 前台退出
router.post('/user/logout', frontendUser.logout)
// 前台账号读取
router.get('/user/account', isUser, frontendUser.getItem)
// 前台账号修改
router.post('/user/account', isUser, frontendUser.account)
// 前台密码修改
router.post('/user/password', isUser, frontendUser.password)
// ------ 喜欢 ------
// 喜欢
router.get('/like', isUser, frontendLike.like)
// 取消喜欢
router.get('/unlike', isUser, frontendLike.unlike)
// 重置喜欢
router.get('/reset/like', isUser, frontendLike.resetLike)

// ------ 代理测试 ------
router.get('/proxy', frontendProxy.getProxyList)

module.exports = router
