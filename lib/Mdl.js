var fs = require('fs');

function readVert(br){
    var vert = {};
    vert.x = br.readUInt8();
    vert.y = br.readUInt8();
    vert.z = br.readUInt8();
    vert.normalIndex = br.readUInt8();
    return vert;
}

function readSimpleFrame(br, numVerts) {
    var simpleFrame = {};
    simpleFrame.bboxMin = readVert(br);
    simpleFrame.bboxMax = readVert(br);
    simpleFrame.name = br.readStr(16);
    simpleFrame.verts = [];
    for (var i=0; i<numVerts; i++) {
        simpleFrame.verts.push(readVert(br));
    }
    return simpleFrame;
}

function BufferReader(buf){
    this.buf = buf;
    this.ptr = 0;
}
BufferReader.prototype.read = function(len){
    var b = this.buf.slice(this.ptr, this.ptr + len);
    this.ptr += len;
    return b;
}
BufferReader.prototype.readFloatLE = function(){
    var n = this.buf.readFloatLE(this.ptr);
    this.ptr += 4;
    return n;
}
BufferReader.prototype.readInt32LE = function(){
    var n = this.buf.readInt32LE(this.ptr);
    this.ptr += 4;
    return n;
}
BufferReader.prototype.readStr = function(len){
    var s = this.buf.toString('utf8', this.ptr, len);
    var termpos = s.indexOf('\u0000');
    if (termpos > -1) s = s.slice(0, termpos);
    this.ptr += len; // will we ever want to keep the ptr at nullterm + 1?
    return s;
}
BufferReader.prototype.readUInt8 = function(){
    var n = this.buf.readUInt8(this.ptr);
    this.ptr += 1;
    return n;
}

function Mdl(){}

Mdl.readFile = function(path, cb) {
    var o = new Mdl();
    return fs.readFile(path, (err, buf) => {
        if (err) return cb(err);
        var br = new BufferReader(buf);
        o.magicNumber = br.readStr(4);
        o.version = br.readInt32LE();
        o.scale = [br.readFloatLE(), br.readFloatLE(), br.readFloatLE()];
        o.translate = [br.readFloatLE(), br.readFloatLE(), br.readFloatLE()];
        o.boundingRadius = br.readFloatLE();
        o.eyePosition = [br.readFloatLE(), br.readFloatLE(), br.readFloatLE()];
        o.numSkins = br.readInt32LE();
        o.skinWidth = br.readInt32LE();
        o.skinHeight = br.readInt32LE();
        o.numVerts = br.readInt32LE();
        o.numTris = br.readInt32LE();
        o.numFrames = br.readInt32LE();
        o.syncType = br.readInt32LE();
        o.flags = br.readInt32LE();
        o.size = br.readInt32LE();

        o.skins = [];
        for (var i=0; i<o.numSkins; i++) {
            var skin = {};

            skin.type = br.readInt32LE();
            if (skin.type == 0) {
                skin.data = br.read(o.skinWidth * o.skinHeight);
            } else {
                throw 'nyi';
            }

            o.skins.push(skin);
        }

        o.texCoords = [];
        for (var i=0; i<o.numVerts; i++) {
            var coord = {};
            coord.onSeam = br.readInt32LE();
            coord.s = br.readInt32LE();
            coord.t = br.readInt32LE();

            o.texCoords.push(coord);
        }

        o.triangles = [];
        for (var i=0; i<o.numTris; i++) {
            var tri = {};
            tri.facesFront = br.readInt32LE();
            tri.vertIndeces = [
                br.readInt32LE(),
                br.readInt32LE(),
                br.readInt32LE()
            ];
            o.triangles.push(tri);
        }

        o.frames = [];
        for (var i=0; i<o.numFrames; i++) {
            var frame = {};
            frame.type = br.readInt32LE();
            if (frame.type == 0) {
                // simple, not group
                frame.simpleFrame = readSimpleFrame(br, o.numVerts);
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
