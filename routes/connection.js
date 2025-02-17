var mysql = require('mysql')

var util = require('util')

var conn = mysql.createConnection({
    host: "bar4m8dcr5eo8pfdpvj4-mysql.services.clever-cloud.com",
    user: "u4vbru7yzhgrsrtc",
    password: "BFYflmJB8HqmldMUj2Yp",
    database: "bar4m8dcr5eo8pfdpvj4"
})

var exe = util.promisify(conn.query).bind(conn)

module.exports = exe
