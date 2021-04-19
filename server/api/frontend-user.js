const md5 = require('md5')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const axios = require('axios')

const mongoose = require('../mongoose')
const User = mongoose.model('User')

const config = require('../config')
const md5Pre = config.md5Pre
const secret = config.secretClient
const mpappApiId = config.apiId
const mpappSecret = config.secret
const strLen = require('../utils').strLen
const general = require('./general')
const { list, modify, deletes, recover } = general

exports.getList = async ctx => {
    await list.call(User, ctx)
}

/**
 * 用户登录
 * @method login
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.login = async ctx => {
    let { username } = ctx.request.body
    const { password } = ctx.request.body
    if (username === '' || password === '') {
        ctx.json({ code: -200, message: '请输入用户名和密码' })
    }
    try {
        let json = {}
        const result = await User.findOne({
            username,
            password: md5(md5Pre + password),
            is_delete: 0
        })
        if (result) {
            username = encodeURI(username)
            const id = result._id
            const email = result.email
            const remember_me = 2592000000
            const token = jwt.sign({ id, username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
            ctx.cookies.set('user', token, { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('userid', id, { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('username', Buffer.from(username).toString('base64'), { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('useremail', email, { maxAge: remember_me, httpOnly: false })
            json = {
                code: 200,
                message: '登录成功',
                data: {
                    user: token,
                    userid: id,
                    username,
                    email
                }
            }
        } else {
            json = {
                code: -200,
                message: '用户名或者密码错误'
            }
        }
        ctx.json(json)
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 微信登录
 * @method jscode2session
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.jscode2session = async ctx => {
    const { js_code } = ctx.request.body
    const xhr = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
            appid: mpappApiId,
            secret: mpappSecret,
            js_code,
            grant_type: 'authorization_code'
        }
    })
    ctx.json({ code: 200, message: '登录成功', data: xhr.data })
}
/**
 * 微信登录
 * @method wxLogin
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.wxLogin = async ctx => {
    const { nickName, wxSignature, avatar } = ctx.request.body

    let id, token, username
    if (!nickName || !wxSignature) {
        ctx.json({ code: -200, message: '参数有误, 微信登录失败' })
    } else {
        try {
            let json = {}
            const result = await User.findOne({
                username: nickName,
                wx_signature: wxSignature,
                is_delete: 0
            })
            if (result) {
                id = result._id
                username = encodeURI(nickName)
                token = jwt.sign({ id, username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
                json = {
                    code: 200,
                    message: '登录成功',
                    data: {
                        user: token,
                        userid: id,
                        username
                    }
                }
                ctx.json(json)
            } else {
                const _result = await User.create({
                    username: nickName,
                    password: '',
                    email: '',
                    creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_delete: 0,
                    timestamp: moment().format('X'),
                    wx_avatar: avatar,
                    wx_signature: wxSignature
                })
                id = _result._id
                username = encodeURI(nickName)
                token = jwt.sign({ id, username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
                ctx.json({
                    code: 200,
                    message: '注册成功!',
                    data: {
                        user: token,
                        userid: id,
                        username
                    }
                })
            }
        } catch (err) {
            ctx.json({ code: -200, message: err.toString() })
        }
    }
}

/**
 * 用户登录
 * @method logout
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.logout = async ctx => {
    ctx.cookies.set('user', '', { maxAge: -1, httpOnly: false })
    ctx.cookies.set('userid', '', { maxAge: -1, httpOnly: false })
    ctx.cookies.set('username', '', { maxAge: -1, httpOnly: false })
    ctx.cookies.set('useremail', '', { maxAge: -1, httpOnly: false })
    ctx.json({ code: 200, message: '退出成功', data: '' })
}

/**
 * 用户注册
 * @method insert
 * @param  {[type]}    ctx  [description]
 * @return {json}         [description]
 */
exports.insert = async ctx => {
    const { email, password, username } = ctx.request.body
    if (!username || !password || !email) {
        ctx.json({ code: -200, message: '请将表单填写完整' })
    } else if (strLen(username) < 4) {
        ctx.json({ code: -200, message: '用户长度至少 2 个中文或 4 个英文' })
    } else if (strLen(password) < 8) {
        ctx.json({ code: -200, message: '密码长度至少 8 位' })
    } else {
        try {
            const result = await User.findOne({ username })
            if (result) {
                ctx.json({ code: -200, message: '该用户名已经存在!' })
            } else {
                await User.create({
                    username,
                    password: md5(md5Pre + password),
                    email,
                    creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_delete: 0,
                    timestamp: moment().format('X')
                })
                ctx.json({ code: 200, message: '注册成功!', data: 'success' })
            }
        } catch (err) {
            ctx.json({ code: -200, message: err.toString() })
        }
    }
}

exports.getItem = async ctx => {
    const userid = ctx.query.id || ctx.cookies.get('userid') || ctx.header['userid']
    try {
        let json
        const result = await User.findOne({
            _id: userid,
            is_delete: 0
        })
        if (result) {
            json = { code: 200, data: result }
        } else {
            json = { code: -200, message: '请先登录, 或者数据错误' }
        }
        ctx.json(json)
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 用户编辑
 * @method modify
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.modify = async ctx => {
    const { id, email, password, username } = ctx.request.body
    const data = {
        email,
        username,
        update_date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    if (password) data.password = md5(md5Pre + password)
    await modify.call(User, ctx, id, data)
}

/**
 * 账号编辑
 * @method account
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.account = async ctx => {
    const { email } = ctx.request.body
    const update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    // const username = ctx.request.body.username || ctx.header['username']
    try {
        await User.updateOneAsync({ _id: user_id }, { $set: { email, update_date } })
        ctx.cookies.set('useremail', email, { maxAge: 2592000000, httpOnly: false })
        ctx.success('success', '更新成功')
    } catch (err) {
        ctx.error(null, err.toString())
    }
}

/**
 * 密码编辑
 * @method password
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.password = async ctx => {
    const { old_password, password } = ctx.request.body
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    try {
        const result = await User.findOne({
            _id: user_id,
            password: md5(md5Pre + old_password),
            is_delete: 0
        })
        if (result) {
            await User.updateOne({ _id: user_id }, { $set: { password: md5(md5Pre + password) } })
            ctx.json({ code: 200, message: '更新成功', data: 'success' })
        } else {
            ctx.json({ code: -200, message: '原始密码错误' })
        }
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

/**
 * 用户删除
 * @method deletes
 * @param  {[type]}    ctx [description]
 * @param  {[type]}    res [description]
 * @return {[type]}        [description]
 */
exports.deletes = async ctx => {
    await deletes.call(User, ctx)
}

/**
 * 用户恢复
 * @method recover
 * @param  {[type]}    ctx [description]
 * @param  {[type]}    res [description]
 * @return {[type]}        [description]
 */
exports.recover = async ctx => {
    await recover.call(User, ctx)
}
