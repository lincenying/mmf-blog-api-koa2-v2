const router = require('koa-router')()

const multer = require('koa-multer')

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, './uploads')
    },
    filename(req, file, cb) {
        const ext = file.originalname.split('.').pop()
        cb(null, 'shihua-' + Date.now() + '.' + ext)
    }
})
const upload = multer({ storage }).single('file')

const cors = require('../middlewares/cors')

const frontendArticle = require('../api/frontend-article')
const frontendComment = require('../api/frontend-comment')
const frontendLike = require('../api/frontend-like')
const frontendUser = require('../api/frontend-user')
const frontendShihua = require('../api/frontend-shihua')
const frontendWeiBo = require('../api/frontend-weibo')
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
// ------ 识花 ------
router.post('/shihua/upload', cors, upload, frontendShihua.upload)
router.get('/shihua/get', cors, frontendShihua.shihua)
router.get('/shihua/history/list', cors, frontendShihua.getHistory)
router.get('/shihua/history/delete', cors, frontendShihua.delHistory)
// ------ 微博 ------
router.get('/weibo/get', cors, frontendWeiBo.get)
router.get('/weibo/card', cors, frontendWeiBo.card)
router.get('/weibo/video', cors, frontendWeiBo.video)
router.get('/weibo/beauty-video', cors, frontendWeiBo.beautyVideo)
router.get('/weibo/detail', cors, frontendWeiBo.detail)
router.get('/weibo/check', cors, frontendWeiBo.checkUpdate)
// ------ 代理测试 ------
router.get('/proxy', frontendProxy.getProxyList)

module.exports = router
