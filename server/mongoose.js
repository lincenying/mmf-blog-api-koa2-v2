const mongoose = require('mongoose')
mongoose.connect(
    'mongodb://localhost/mmfblog_v2',
    { useNewUrlParser: true }
)
mongoose.Promise = global.Promise
module.exports = mongoose
