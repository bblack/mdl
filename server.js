var express = require('express');
var app = express();
var Mdl = require('./lib/Mdl');

app.engine('html', require('ejs').renderFile);
app.use(require('compression')());
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.render('index.html');
});

app.get('/player.mdl', function(req, res){
    Mdl.readFile('./public/player.mdl', function(err, mdl){
        res.json(mdl);
    });
});

app.listen(8088);
