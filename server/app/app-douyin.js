const axios = require('axios')
const crc32 = require('../utils/crc32')
const lruCache = require('../utils/lru-cache').douyinCache

const moment = require('moment')
const mongoose = require('../mongoose')
const DouYin = mongoose.model('DouYin')
const DouYinUser = mongoose.model('DouYinUser')

exports.insertUser = async ctx => {
    const { user_id, user_name, user_avatar, sec_uid, share_url } = ctx.request.body
    const data = {
        user_id,
        user_name,
        user_avatar,
        sec_uid,
        share_url,
        creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        is_delete: 0,
        timestamp: moment().format('X')
    }
    try {
        const checkRepeat = await DouYinUser.findOne({ user_id })
        if (checkRepeat) {
            ctx.json({ code: 300, message: '该用户已经存在!' })
        } else {
            const result = await DouYinUser.create(data)
            ctx.json({ code: 200, message: '添加成功', data: result })
        }
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

exports.insert = async ctx => {
    const { user_id, aweme_id, desc, vid, image, video } = ctx.request.body
    const data = {
        author: user_id,
        aweme_id,
        desc,
        vid,
        image,
        video,
        creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        is_delete: 0,
        timestamp: moment().format('X')
    }
    try {
        const checkRepeat = await DouYin.findOne({ aweme_id })
        if (checkRepeat) {
            ctx.json({ code: 300, message: '该视频已经存在!' })
        } else {
            const result = await DouYin.create(data)
            ctx.json({ code: 200, message: '发布成功', data: result })
        }
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

exports.getList = async ctx => {
    let { limit, page } = ctx.query
    const user_id = ctx.query.user_id

    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    const payload = {
        is_delete: 0
    }
    const skip = (page - 1) * limit
    const sort = '-aweme_id'

    const filds = 'user user_id aweme_id desc vid image video creat_date is_delete timestamp'

    if (user_id) {
        payload.user_id = user_id
    }

    try {
        const [data, total] = await Promise.all([
            DouYin.find(payload, filds).sort(sort).skip(skip).limit(limit).exec(),
            DouYin.countDocuments(payload)
        ])
        const totalPage = Math.ceil(total / limit)
        const json = {
            code: 200,
            data: {
                list: data,
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1
            }
        }
        ctx.json(json)
    } catch (err) {
        ctx.json({ code: -200, message: err.toString() })
    }
}

exports.getItem = async ctx => {
    const vid = ctx.query.id
    if (!vid) {
        ctx.json({ ok: 2, msg: '参数错误' })
        return
    }
    let main_url = lruCache.get('douyin_' + vid)
    if (main_url) {
        return ctx.json({
            code: 200,
            data: main_url,
            from: 'lru-cache',
            msg: ''
        })
    }

    const url = '/video/urls/v/1/toutiao/mp4/' + vid + '?r=' + new Date().getTime()
    const crc = crc32(url)
    const fullUrl = 'http://i.snssdk.com' + url + '&s=' + crc
    const options = {
        method: 'get',
        url: fullUrl,
        headers: {
            Referer: 'https://www.ixigua.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
            cookie:
                'wafid=b91cc9ea-f8c9-4665-aefd-5eb32504c548; wafid.sig=6RJyXryyR309k1jBSiRHNOIUbWg; xiguavideopcwebid=6779498568983889411; xiguavideopcwebid.sig=thxI4ay_N8VBsX1clmDdpMXPDf8; SLARDAR_WEB_ID=bc0b73ca-1788-4689-b919-05355f8a0021',
            'upgrade-insecure-requests': 1
        }
    }
    try {
        const xhr = await axios(options)
        const json = xhr.data
        if (json.data.video_list && json.data.video_list.video_3) main_url = json.data.video_list.video_3.main_url
        else if (json.data.video_list && json.data.video_list.video_2) main_url = json.data.video_list.video_2.main_url
        else if (json.data.video_list && json.data.video_list.video_1) main_url = json.data.video_list.video_1.main_url
        if (main_url) {
            main_url = Buffer.from(main_url, 'base64').toString()
        }
        if (main_url) {
            lruCache.set('douyin_' + vid, main_url)
        }
        ctx.json({
            code: 200,
            data: main_url,
            from: 'douyin',
            msg: ''
        })
    } catch (error) {
        ctx.json({ code: 300, data: '', msg: error.toString() })
    }
}
