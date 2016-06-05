module.exports = function(config) {
    config.secret = config.secret || ''
    config.port = config.port || 3000
    config.scriptdir = config.scriptdir || '.'
    if (!config.hooks) {
        console.error('error: hooks is needed')
        return
    }

    var crypto = require('crypto')
    var fs = require('fs')
    var path = require('path')
    var exec = require('child_process').exec

    var express = require('express')
    var morgan = require('morgan')
    var bodyParser = require('body-parser')

    var app = express()

    function checkSecret(payload, sigHeader) {
        if (sigHeader) {
            var hmac = crypto.createHmac('sha1', config.secret)
            hmac.update(JSON.stringify(payload))
            var calculated = hmac.digest('hex')
            return 'sha1=' + calculated == sigHeader 
        }
        return false
    }

    app.use(morgan('combined'))
    app.use(bodyParser.json())

    app.use('/event', function(req, res, next) {
        if (checkSecret(req.body, req.header('X-Hub-Signature'))) {
            next();
        } else {
            var result = {'error': 'signature check failure'}
            res.end(JSON.stringify(result))
        }
    })

    app.get('/h', function(req, res) {
        console.log('get', path.dirname('.'));
        var d = {path: 'hello'}
        res.end(JSON.stringify(d))
    })

    function eventInfo(request) {
        var action = request.header('X-Github-Event')
        var repo = request.body.repository.full_name
        return {
            action: action,
            repo: repo
        }
    }

    function command(info) {
        if (config.hooks[info.repo] && config.hooks[info.repo][info.action]) {
            return config.hooks[info.repo][info.action]
        }
        return null
    }

    app.post('/event', function(req, res) {
        var info = eventInfo(req)
        var cmd = command(info)
        if (cmd) {
            cmd = 'cd ' + config.scriptdir + ';' + cmd
            exec(cmd, function(err, stdout, stderr) {
                console.log(err)
                if (err) {
                    res.end(JSON.stringify({success: false}))
                } else {
                    res.end(JSON.stringify({success: true}))
                }
            })
        } else {
            res.end(JSON.stringify({success: false}))
        }
    })


    function start() {
        var server = app.listen(config.port, function() {
            var host = server.address().address
            var port = server.address().port
            console.log('listening  at http://%s:%s', host, port)
        })
    }

    return {
        start: start
    }
}

