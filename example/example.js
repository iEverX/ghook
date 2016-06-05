var hooks = require('./hooks.json')
var SECRET = 'asd0023-=Df3asdg;h2 -=*7&Usdf,'

var ghook = require('../ghook')
var server = ghook({
    secret: SECRET,
    port: 3000,
    hooks: hooks,
    scriptdir: '/home/ubuntu/ghook/scripts/'
})

server.start()
