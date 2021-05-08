const md5 = require('md5')
const fs = require('fs')
const moment = require('moment')
const jwt = require('jsonwebtoken')

const mongoose = require('../mongoose')
const Admin = mongoose.model('Admin')
const fsExistsSync = require('../utils').fsExistsSync
const config = require('../config')
const md5Pre = config.md5Pre
const secret = config.secretServer
const general = require('./general')
const { list, item, modify, deletes, recover } = general

/**
 * 获取管理员列表
 * @method getList
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getList = async ctx => {
    await list.call(Admin, ctx)
}

/**
 * 获取单个管理员
 * @method getItem
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getItem = async ctx => {
    await item.call(Admin, ctx)
}

/**
 * 管理员登录
 * @method loginAdmin
 * @param  {[type]} ctx [description]
 * @return {[type]}       [description]
 */
exports.login = async ctx => {
    const { password, username } = ctx.request.body
    if (username === '' || password === '') {
        return ctx.json({ code: -200, message: '请输入用户名和密码' })
    }
    try {
        const result = await Admin.findOne({
            username,
            password: md5(md5Pre + password),
            is_delete: 0
        })
        if (result) {
            const _username = encodeURI(username)
            const id = result._id.toString()
            const remember_me = 2592000000
            const token = jwt.sign({ id, username: _username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
            ctx.cookies.set('b_user', token, { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('b_userid', id, { maxAge: remember_me })
            ctx.cookies.set('b_username', Buffer.from(_username).toString('base64'), { maxAge: remember_me })
            return ctx.json({ code: 200, message: '登录成功', data: token })
        }
        return ctx.json({ code: -200, message: '用户名或者密码错误' })
    } catch (error) {
        ctx.json({ code: -200, message: error.toString() })
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
    const { email, password, username } = ctx.request.body
    const payload = {}
    if (fsExistsSync('./admin.lock')) {
        payload.message = '请先把 admin.lock 删除'
    } else if (!username || !password || !email) {
        payload.message = '请将表单填写完整'
    } else {
        try {
            const result = await Admin.findOneAsync({ username })
            if (result) {
                payload.message = '该用户已经存在'
            } else {
                await Admin.createAsync({
                    username,
                    password: md5(md5Pre + password),
                    email,
                    creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_delete: 0,
                    timestamp: moment().format('X')
                })
                await fs.writeFileSync('./admin.lock', username)
                payload.message = '添加用户成功: ' + username + ', 密码: ' + password
            }
        } catch (err) {
            payload.message = err.toString()
        }
    }
    await ctx.render('admin-add', payload)
}

/**
 * 管理员编辑
 * @method modifyAdmin
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.modify = async ctx => {
    const { id, email, password, username } = ctx.request.body
    var data = {
        email,
        username,
        update_date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    if (password) data.password = md5(md5Pre + password)
    await modify.call(Admin, ctx, id, data)
}

/**
 * 管理员删除
 * @method deletes
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.deletes = async ctx => {
    await deletes.call(Admin, ctx)
}

/**
 * 管理员恢复
 * @method recover
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.recover = async ctx => {
    await recover.call(Admin, ctx)
}
