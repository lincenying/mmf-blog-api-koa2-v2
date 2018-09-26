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
const strlen = require('../utils').strlen
const general = require('./general')
const { list, modify, deletes, recover } = general

exports.getList = async ctx => {
    await list(ctx, User)
}

/**
 * 用户登录
 * @method login
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.login = async ctx => {
    const { username, password } = ctx.request.body
    if (username === '' || password === '') {
        ctx.error('请输入用户名和密码')
    }
    try {
        const result = await User.findOneAsync({ username, password: md5(md5Pre + password), is_delete: 0 })
        if (result) {
            const id = result._id
            const remember_me = 2592000000
            const _username = encodeURI(username)
            const token = jwt.sign({ id, username: _username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
            ctx.cookies.set('user', token, { maxAge: remember_me, httpOnly: false })
            ctx.cookies.set('userid', id, { maxAge: remember_me })
            ctx.cookies.set('username', new Buffer(_username).toString('base64'), { maxAge: remember_me })
            ctx.success(token, '登录成功')
        } else {
            ctx.error('用户名或者密码错误')
        }
    } catch (err) {
        ctx.error(err.toString())
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
            grant_type: 'authorization_code',
        },
    })
    ctx.success(xhr.data, '登录成功')
}
/**
 * 微信登录
 * @method wxLogin
 * @param  {[type]}   ctx [description]
 * @return {[type]}       [description]
 */
exports.wxLogin = async ctx => {
    let id, token, username
    const { nickName, wxSignature, avatar } = ctx.request.body
    if (!nickName || !wxSignature) {
        ctx.error('参数有误, 微信登录失败')
    } else {
        try {
            const result = await User.findOneAsync({
                username: nickName,
                wx_signature: wxSignature,
                is_delete: 0,
            })
            if (result) {
                id = result._id
                username = encodeURI(nickName)
                token = jwt.sign({ id, username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
                ctx.success(
                    {
                        user: token,
                        userid: id,
                        username,
                    },
                    '登录成功'
                )
            } else {
                const _result = await User.createAsync({
                    username: nickName,
                    password: '',
                    email: '',
                    creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_delete: 0,
                    timestamp: moment().format('X'),
                    wx_avatar: avatar,
                    wx_signature: wxSignature,
                })
                id = _result._id
                username = encodeURI(nickName)
                token = jwt.sign({ id, username }, secret, { expiresIn: 60 * 60 * 24 * 30 })
                ctx.success(
                    {
                        user: token,
                        userid: id,
                        username,
                    },
                    '注册成功'
                )
            }
        } catch (err) {
            ctx.error(err.toString())
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
    ctx.cookies.set('userid', '', { maxAge: -1 })
    ctx.cookies.set('username', '', { maxAge: -1 })
    ctx.success('', '退出成功')
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
        ctx.error('请将表单填写完整')
    } else if (strlen(username) < 4) {
        ctx.error('用户长度至少 2 个中文或 4 个英文')
    } else if (strlen(password) < 8) {
        ctx.error('密码长度至少 8 位')
    } else {
        try {
            const result = await User.findOneAsync({ username })
            if (result) {
                ctx.error('该用户名已经存在')
            } else {
                await User.createAsync({
                    username,
                    password: md5(md5Pre + password),
                    email,
                    creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    is_delete: 0,
                    timestamp: moment().format('X'),
                })
                ctx.success('success', '注册成功')
            }
        } catch (err) {
            ctx.error(err.toString())
        }
    }
}

exports.getItem = async ctx => {
    const userid = ctx.query.id || ctx.cookies.get('userid') || ctx.header['userid']
    try {
        const result = await User.findOneAsync({ _id: userid, is_delete: 0 })
        if (result) {
            ctx.success(result)
        } else {
            ctx.error('请先登录, 或者数据错误')
        }
    } catch (err) {
        ctx.error(err.toString())
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
    const update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    const data = { email, username, update_date }
    if (password) data.password = md5(md5Pre + password)
    await modify(ctx, User, id, data)
}

/**
 * 账号编辑
 * @method account
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.account = async ctx => {
    const { id, email } = ctx.request.body
    const update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    const username = ctx.request.body.username || ctx.header['username']
    if (user_id === id) {
        try {
            await User.updateOneAsync({ _id: id }, { $set: { email, username, update_date } })
            ctx.success('success', '更新成功')
        } catch (err) {
            ctx.error(err.toString())
        }
    } else {
        ctx.error('当前没有权限')
    }
}

/**
 * 密码编辑
 * @method password
 * @param  {[type]}    ctx [description]
 * @return {[type]}        [description]
 */
exports.password = async ctx => {
    const { id, old_password, password } = ctx.request.body
    const update_date = moment().format('YYYY-MM-DD HH:mm:ss')
    const user_id = ctx.cookies.get('userid') || ctx.header['userid']
    if (user_id === id) {
        try {
            const result = await User.findOneAsync({ _id: id, password: md5(md5Pre + old_password), is_delete: 0 })
            if (result) {
                await User.updateOneAsync({ _id: id }, { $set: { password: md5(md5Pre + password), update_date } })
                ctx.success('success', '更新成功')
            } else {
                ctx.error('原始密码错误')
            }
        } catch (err) {
            ctx.error(err.toString())
        }
    } else {
        ctx.error('当前没有权限')
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
    await deletes(ctx, User)
}

/**
 * 用户恢复
 * @method recover
 * @param  {[type]}    ctx [description]
 * @param  {[type]}    res [description]
 * @return {[type]}        [description]
 */
exports.recover = async ctx => {
    await recover(ctx, User)
}
