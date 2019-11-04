const fs = require('fs')
const moment = require('moment')
const AipImageClassifyClient = require('baidu-aip-sdk').imageClassify
const config = require('../config/shihua')
const check = require('../middlewares/check')

const mongoose = require('../mongoose')
const Shihua = mongoose.model('Shihua')

exports.upload = async ctx => {
    if (ctx.req.file) {
        const file = ctx.req.file
        ctx.success(null, '', { url: file.path })
    } else {
        ctx.error(null, '文件上传失败')
    }
}
exports.shihua = async ctx => {
    const img_id = ctx.query.id
    const token = ctx.cookies.user || ctx.header.user
    const userid = ctx.cookies.userid || ctx.header.userid
    let username = ctx.cookies.username || ctx.header.username
    username = new Buffer(username, 'base64').toString()
    const decoded = await check(token, 'user')
    let isLogin
    if (decoded && decoded.id === userid && decoded.username === username) {
        isLogin = true
    }
    const getData = async () => {
        const client = new AipImageClassifyClient(config.APP_ID, config.API_KEY, config.SECRET_KEY)
        try {
            const image = fs.readFileSync('./uploads/' + img_id).toString('base64')
            const options = {}
            options['baike_num'] = '5'
            // 带参数调用植物识别
            const shihuaResult = await client.plantDetect(image, options)
            if (isLogin) {
                const length = shihuaResult.result.length
                let img, name
                for (let i = 0; i < length; i++) {
                    const item = shihuaResult.result[i]
                    if (item.baike_info && item.baike_info.image_url) {
                        name = item.name
                        img = item.baike_info.image_url
                        break
                    }
                }
                if (img && name) {
                    await Shihua.createAsync({
                        user_id: userid,
                        img_id,
                        name,
                        img,
                        result: JSON.stringify(shihuaResult.result),
                        creat_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                        is_delete: 0,
                        timestamp: moment().format('X')
                    })
                    fs.unlinkSync('./uploads/' + img_id)
                }
            }
            return {
                success: true,
                data: shihuaResult
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    if (isLogin) {
        Shihua.findOneAsync({ img_id, user_id: userid }).then(async result => {
            if (result) {
                ctx.success({}, '', {
                    code: 200,
                    from: 'db',
                    userid,
                    result: JSON.parse(result.result)
                })
            } else {
                let data = await getData()
                if (!data.success) data = await getData()
                if (!data.success) data = await getData()
                if (data.success) {
                    ctx.success({}, '', {
                        code: 200,
                        from: 'api',
                        userid,
                        ...data.data
                    })
                } else {
                    ctx.error(null, data.message || '读取数据失败', { userid })
                }
            }
        })
    } else {
        let data = await getData()
        if (!data.success) data = await getData()
        if (!data.success) data = await getData()
        if (data.success) {
            ctx.success({}, '', {
                code: 200,
                from: 'api',
                ...data.data
            })
        } else {
            ctx.error({}, data.message || '读取数据失败')
        }
    }
}

/**
 * 获取识花历史列表
 * @method getHistory
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.getHistory = ctx => {
    const userid = ctx.cookies.userid || ctx.header.userid
    let { limit, page } = ctx.query
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    const data = {
        is_delete: 0,
        user_id: userid
    }
    const skip = (page - 1) * limit
    const sort = '-creat_date'

    Promise.all([
        Shihua.find(data)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec(),
        Shihua.countDocumentsAsync(data)
    ])
        .then(([data, total]) => {
            const totalPage = Math.ceil(total / limit)
            const json = {
                code: 200,
                data: {
                    total,
                    hasNext: totalPage > page ? 1 : 0,
                    hasPrev: page > 1
                }
            }
            data = data.map(item => {
                item.result = ''
                return item
            })
            json.data.list = data
            ctx.success({}, '', json)
        })
        .catch(err => {
            ctx.error(null, err.toString())
        })
}

/**
 * 删除识花历史列表
 * @method delHistory
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
exports.delHistory = ctx => {
    const userid = ctx.cookies.userid || ctx.header.userid
    const { img_id } = ctx.query

    Shihua.deleteOne({ img_id, user_id: userid })
        .then(() => {
            ctx.success(null, '删除成功')
        })
        .catch(err => {
            ctx.error(null, err.toString())
        })
}
