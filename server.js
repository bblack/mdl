var express = require('express');
var app = express();
var Mdl = require('./lib/Mdl');
var fs = require('fs');

app.engine('html', require('ejs').renderFile);
app.use(require('compression')());
app.use('/public', express.static(__dirname + '/public'));
app.get('/favicon.ico', (req, res) => {
    res.sendfile('./public/favicon.ico');
});

app.get('/', function(req, res){
    res.render('index.html');
});

app.get('/player.mdl', function(req, res){
    Mdl.readFile('./public/player.mdl', function(err, mdl){
        res.json(mdl);
    });
})
.get('/palette', function(req, res){
    var buf = fs.readFileSync('./public/palette.lmp');
    var out = [];
    for (var i=0; i<256; i++) {
        var r = buf.readUInt8(i*3);
        var g = buf.readUInt8(i*3 + 1);
        var b = buf.readUInt8(i*3 + 2);
        out.push([r, g, b]);
    }
    res.json(out);
})

app.listen(8088);
