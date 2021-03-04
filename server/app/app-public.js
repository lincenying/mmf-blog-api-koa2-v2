const fs = require('fs')

exports.checkUpdate = ctx => {
    const jsonTxt = fs.readFileSync('./server/config/app.json', 'utf-8')
    const json = JSON.parse(jsonTxt)
    ctx.json({ code: 200, data: json })
}
