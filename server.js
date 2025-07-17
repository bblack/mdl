var express = require('express');
var fs = require('fs');

var app = express()
.engine('html', require('ejs').renderFile)
.use(require('compression')())
.use('/public', express.static(__dirname + '/public'))
.get('/favicon.ico', (req, res) => res.sendfile('./public/favicon.ico'))
.get('/', (req, res) => res.render('index.html'))
.get('/palette', (req, res) => {
    var buf = fs.readFileSync('./public/palette.lmp');
    var out = [];
    for (var i=0; i<256; i++) {
        var r = buf.readUInt8(i*3);
        var g = buf.readUInt8(i*3 + 1);
        var b = buf.readUInt8(i*3 + 2);
        out.push([r, g, b]);
    }
    res.json(out);
});

app.listen(8088, function() {
  console.log(`listening at http://localhost:${this.address().port}/`);
});
