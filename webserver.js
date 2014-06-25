var connect = require('connect')
	, http = require('http')
	,	fs = require('graceful-fs')
	, app = connect()
	, log = require('npmlog')
	, path = require('path')

module.exports = function( folder, port ){
	app.use(function(req, res){
		var request = path.join(process.cwd(), req.url)
		if(!path.extname(request)) request += '/index.html'
		fs.readFile(request, function(err, data){
			if (err) log.error('server',request) 
				res.end(data)
		})
	})
	http.createServer(app).listen(port || 8080)

}

