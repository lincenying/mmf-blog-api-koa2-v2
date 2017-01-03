var md5 = require('md5')
var fs = require('fs')
var moment = require('moment')
var jwt = require('jsonwebtoken')

var mongoose = require('../mongoose')
var Admin = mongoose.model('Admin')
var fsExistsSync = require('../utils').fsExistsSync
var config = require('../config')
var md5Pre = config.md5Pre
var secret = config.secret
const general = require('./general')

const list = general.list
const item = general.item
const modify = general.modify
const deletes = general.deletes
const recover = general.recover

/**
 * 获取管理员列表
 * @method getList
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    await list(ctx, Admin)
}

/**
 * 获取单个管理员
 * @method getItem
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getItem = async ctx => {
    await item(ctx, Admin)
}

/**
 * 管理员登录
 * @method loginAdmin
 * @param  {[type]} ctx [description]
 * @return {[type]}       [description]
 */
exports.login = async ctx => {
    var password = ctx.request.body.password,
        username = ctx.request.body.username
    if (username === '' || password === '') {
        ctx.error('请输入用户名和密码')
        return
    }
    try {
        const result = await Admin.findOneAsync({
            username,
            password: md5(md5Pre + password),
            is_delete: 0
        })
        if (result) {
            var id = result._id
            var remember_me = 2592000000
            var token = jwt.sign({
                id,
                username
            }, secret, {
                expiresIn: 60*60*24*30
            })
            ctx.cookies.set('b_user', token, { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('b_userid', id, { maxAge: remember_me })
            ctx.cookies.set('b_username', new Buffer(username).toString('base64'), { maxAge: remember_me })
            ctx.success(token, '登录成功')
        } else {
            ctx.error('用户名或者密码错误')
        }
    } catch (err) {
        ctx.error(err.toString())
    }
}

/**
 * 初始化时添加管理员
 * @method insertAdmin
 * @param  {[type]}    ctx  [description]
 * @param  {[type]}    next  [description]
 * @return {json}         [description]
 */
exports.insert = async ctx => {
    var email = ctx.request.body.email,
        password = ctx.request.body.password,
        username = ctx.request.body.username

    if (fsExistsSync('./admin.lock')) {
        return ctx.render('admin-add', {message: '请先把 admin.lock 删除'})
    }
    if (!username || !password || !email) {
        return ctx.render('admin-add', { message: '请将表单填写完整' })
    }
    try {
        const payload = {}
        const result = await Admin.findOneAsync({ username })
        if (result) {
            payload.message = '该用户已经存在'
        } else {
            await Admin.createAsync({
                username,
                password: md5(md5Pre + password),
                email,
                creat_date: moment().format('YYYY-MM-DD HH:MM:SS'),
                is_delete: 0,
                timestamp: moment().format('X')
            })
            await fs.writeFileSync('./admin.lock', username)
            payload.message = '添加用户成功: '+username+', 密码: '+password
        }
        return ctx.render('admin-add', payload)
    } catch (err) {
        return ctx.render('admin-add', {
            message: err.toString()
        })
    }
}

/**
 * 管理员编辑
 * @method modifyAdmin
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.modify = async ctx => {
    var _id = ctx.request.body.id,
        email = ctx.request.body.email,
        password = ctx.request.body.password,
        username = ctx.request.body.username
    password = md5(md5Pre + password)
    await modify(ctx, Admin, _id, { email, password, username })
}

/**
 * 管理员删除
 * @method deletes
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.deletes = async ctx => {
    await deletes(ctx, Admin)
}

/**
 * 管理员恢复
 * @method recover
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.recover = async ctx => {
    await recover(ctx, Admin)
}
