var fs = require('fs');
var inspect = require('util').inspect;

var readStr = function(stream, bytes) {
    var buf = stream.read(bytes);
    return buf.toString().split('\x00', 1)[0];
}

var readInt = function(stream) {
    var buf = stream.read(4);
    var out = buf.readInt32LE(0);
    return out;
}

var readFloat = function(stream) {
    var buf = stream.read(4);
    var out = buf.readFloatLE(0);
    return out;
}

var readVec3 = function(stream) {
    return [
        readFloat(stream),
        readFloat(stream),
        readFloat(stream)
    ];
}

var readVert = function(stream) {
    var vert = {};
    vert.x = stream.read(1)[0];
    vert.y = stream.read(1)[0];
    vert.z = stream.read(1)[0];
    vert.normalIndex = stream.read(1)[0];
    return vert;
}

var readSimpleFrame = function(stream, numVerts) {
    var simpleFrame = {};
    simpleFrame.bboxMin = readVert(stream);
    simpleFrame.bboxMax = readVert(stream);
    simpleFrame.name = readStr(stream, 16);
    simpleFrame.verts = [];
    for (var i=0; i<numVerts; i++) {
        simpleFrame.verts.push(readVert(stream));
    }
    return simpleFrame;
}

var Mdl = function(){}

Mdl.readFile = function(path, cb) {
    var o = new Mdl();

    // todo - fix this highWaterMark hack
    var fileStream = fs.createReadStream(path, {highWaterMark: 1024 * 1024 * 1024});

    fileStream.once('readable', function(){
        o.magicNumber = readStr(fileStream, 4);
        o.version = readInt(fileStream);
        o.scale = readVec3(fileStream);
        o.translate = readVec3(fileStream);
        o.boundingRadius = readFloat(fileStream);
        o.eyePosition = readVec3(fileStream);
        o.numSkins = readInt(fileStream);
        o.skinWidth = readInt(fileStream);
        o.skinHeight = readInt(fileStream);
        o.numVerts = readInt(fileStream);
        o.numTris = readInt(fileStream);
        o.numFrames = readInt(fileStream);
        o.syncType = readInt(fileStream);
        o.flags = readInt(fileStream);
        o.size = readInt(fileStream);

        o.skins = [];
        for (var i=0; i<o.numSkins; i++) {
            var skin = {};

            skin.type = readInt(fileStream);
            if (skin.type == 0) {
                skin.data = fileStream.read(o.skinWidth * o.skinHeight);
            } else {
                throw 'nyi';
            }

            o.skins.push(skin);
        }

        o.texCoords = [];
        for (var i=0; i<o.numVerts; i++) {
            var coord = {};
            coord.onSeam = readInt(fileStream);
            coord.s = readInt(fileStream);
            coord.t = readInt(fileStream);

            o.texCoords.push(coord);
        }

        o.triangles = [];
        for (var i=0; i<o.numTris; i++) {
            var tri = {};
            tri.facesFront = readInt(fileStream);
            tri.vertIndeces = [
                readInt(fileStream),
                readInt(fileStream),
                readInt(fileStream)
            ];
            o.triangles.push(tri);
        }

        o.frames = [];
        for (var i=0; i<o.numFrames; i++) {
            var frame = {};
            frame.type = readInt(fileStream);
            if (frame.type == 0) {
                // simple, not group
                frame.simpleFrame = readSimpleFrame(fileStream, o.numVerts);
            } else {
                // group frame
                throw 'fuck';
            }
            o.frames.push(frame);
        }
        cb(null, o);
    });
}

module.exports = Mdl;

// Mdl.readFile('./public/player.mdl', function(err, model){
//     console.log(model);
// });
