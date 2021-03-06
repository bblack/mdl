angular.module('mdlr', [])
.factory('Mdl', function(){
    function Mdl(obj){
        Object.assign(this, obj);
    }
    Mdl.fromBuffer = function(buf){
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
            var s = this.buf.toString('utf8', this.ptr, this.ptr + len);
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
        function BufferWriter(buf){
            this.buf = buf;
            this.ptr = ptr;
        }

        var br = new BufferReader(buf);
        var o = {};
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
        o.size = br.readFloatLE();

        o.skins = [];
        for (var i=0; i<o.numSkins; i++) {
            var skin = {};

            skin.type = br.readInt32LE();
            if (skin.type == 0) {
                skin.data = {data: br.read(o.skinWidth * o.skinHeight)};
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

        _.each(o.frames, (f) => {
            _.each(f.simpleFrame.verts, (v) => {
                v.x = v.x * o.scale[0] + o.translate[0];
                v.y = v.y * o.scale[1] + o.translate[1];
                v.z = v.z * o.scale[2] + o.translate[2];
            })
        })

        return new Mdl(o);
    }
    function BufferWriter(buf){
        this.buf = buf;
        this.ptr = 0;
    }
    BufferWriter.prototype.write = function(str, length, encoding){
        this.buf.write(str, this.ptr, length, encoding);
        this.ptr += (length === undefined ? str.length : length);
    }
    BufferWriter.prototype.writeInt32LE = function(val){
        this.buf.writeInt32LE(val, this.ptr);
        this.ptr += 4;
    }
    BufferWriter.prototype.writeFloatLE = function(val){
        this.buf.writeFloatLE(val, this.ptr);
        this.ptr += 4;
    }
    BufferWriter.prototype.writeUInt8 = function(val){
        this.buf.writeUInt8(val, this.ptr);
        this.ptr += 1;
    }
    BufferWriter.prototype.writeVec3 = function(val){
        [0, 1, 2].forEach((n) => this.writeFloatLE(val[n]))
    }
    function writeVert(bw, v, scale, translate){
        bw.writeUInt8((v.x - translate[0]) / scale[0]);
        bw.writeUInt8((v.y - translate[1]) / scale[1]);
        bw.writeUInt8((v.z - translate[2]) / scale[2]);
        bw.writeUInt8(v.normalIndex);
    }
    Mdl.prototype.toBuffer = function(){
        var headerSize = 84;
        var skinsSize = this.skins.length * (4 + (this.skinWidth * this.skinHeight));
        var texCoordsSize = this.texCoords.length * 12;
        var trisSize = this.triangles.length * 16;
        var framesSize = this.frames.length * (28 + this.texCoords.length * 4);
        var mdlbuf = new buffer.Buffer(headerSize + skinsSize + texCoordsSize +
            trisSize + framesSize);
        mdlbuf.fill(0x00);
        // calc scale & translate.
        var maxvert = [-Infinity, -Infinity, -Infinity];
        var minvert = [Infinity, Infinity, Infinity];
        for (f of this.frames) {
            for (v of f.simpleFrame.verts) {
                if (v.x < minvert[0]) minvert[0] = v.x;
                if (v.x > maxvert[0]) maxvert[0] = v.x;
                if (v.y < minvert[1]) minvert[1] = v.y;
                if (v.y > maxvert[1]) maxvert[1] = v.y;
                if (v.z < minvert[2]) minvert[2] = v.z;
                if (v.z > maxvert[2]) maxvert[2] = v.z;
            }
        }
        var scale = [0,1,2].map((i) => (maxvert[i] - minvert[i]) / 255);
        var translate = minvert;
        var bw = new BufferWriter(mdlbuf);
        bw.write('IDPO');
        bw.writeInt32LE(this.version);
        bw.writeVec3(scale);
        bw.writeVec3(translate);
        bw.writeFloatLE(this.boundingRadius);
        bw.writeVec3(this.eyePosition);
        bw.writeInt32LE(this.numSkins);
        bw.writeInt32LE(this.skinWidth);
        bw.writeInt32LE(this.skinHeight);
        bw.writeInt32LE(this.numVerts);
        bw.writeInt32LE(this.numTris);
        bw.writeInt32LE(this.numFrames);
        bw.writeInt32LE(this.syncType);
        bw.writeInt32LE(this.flags);
        bw.writeFloatLE(this.size); // TODO: what is this
        this.skins.forEach((skin) => {
            if (skin.type != 0) throw 'nyi';
            bw.writeInt32LE(skin.type);
            var pixels = new buffer.Buffer(skin.data.data);
            // REVERSE PALETTE LOOKUP HERE! RGB -> index
            pixels.copy(bw.buf, bw.ptr);
            bw.ptr += pixels.length;
        })
        this.texCoords.forEach((tc) => {
            bw.writeInt32LE(tc.onSeam);
            bw.writeInt32LE(tc.s);
            bw.writeInt32LE(tc.t);
        })
        this.triangles.forEach((tri) => {
            bw.writeInt32LE(tri.facesFront);
            bw.writeInt32LE(tri.vertIndeces[0]);
            bw.writeInt32LE(tri.vertIndeces[1]);
            bw.writeInt32LE(tri.vertIndeces[2]);
        })
        this.frames.forEach((f) => {
            bw.writeInt32LE(f.type);
            if (f.type != 0) throw 'nyi';
            // previously we will have come up with mdl.scale, mdl.translate,
            // and use those to come up with the uint8-compressed coords
            writeVert(bw, f.simpleFrame.bboxMin, [1,1,1], [0,0,0]); // TODO: derive scale & translate
            writeVert(bw, f.simpleFrame.bboxMax, [1,1,1], [0,0,0]); // TODO: derive scale & translate
            bw.write(f.simpleFrame.name, 16);
            f.simpleFrame.verts.forEach((v) => writeVert(bw, v, scale, translate));
        })
        return mdlbuf;
    }
    Mdl.prototype.addVert = function(x, y, z){
        this.texCoords.push({s: 0, t: 0, onSeam: 0});
        this.frames.forEach((f) => {
            f.simpleFrame.verts.push({x: x, y: y, z: z});
        });
    }
    return Mdl;
})
.controller('ControlsController', function($scope, $interval, $rootScope, $element){
    $scope.TOOLS = ['single', 'sweep', 'move', 'addvert', 'addtri'];
    var lastTickTime;
    function lerpFrame(){
        if (!lastTickTime) lastTickTime = Date.now();
        var newTickTime = Date.now();
        var lerp = (newTickTime - lastTickTime) / 100;
        lastTickTime = newTickTime;
        $rootScope.frame = ($rootScope.frame + lerp) % $scope.model.frames.length
        if ($scope.playing) {
            requestAnimationFrame(lerpFrame);
        } else {
            $rootScope.frame = Math.floor($rootScope.frame);
        }
    }
    $scope.play = function(){
        if ($scope.playing) { return; }
        $scope.playing = true;
        lerpFrame();
    };
    $scope.stop = function(){
        delete $scope.playing;
    };
    $scope.open = function(evt){
        var file = $element.find('input#file')[0].files[0];
        var fr = new FileReader();
        fr.onloadend = (a,b,c) => {
            if (fr.readyState != FileReader.DONE) throw 'status bad';
            var arraybuffer = fr.result;
            var buf = new buffer.Buffer(new Uint8Array(arraybuffer));
            $scope.$apply(() => $scope.$emit('modelbuffer', buf));
        }
        fr.readAsArrayBuffer(file);
    }
    $scope.save = function(){
        var mdlbuf = $scope.model.toBuffer();
        var mdlblob = new Blob([mdlbuf], {type: 'application/octet-stream'});
        window.location = URL.createObjectURL(mdlblob);
    }
})
.controller('QuadViewController', function($scope, $rootScope, $http){
    $scope.selectedVerts = [];
    $http.get('palette')
    .then(function(res){
        $rootScope.palette = res.data;
        return $http.get('/public/player.mdl', {responseType: 'arraybuffer'})
        .then(function(res){
            var buf = new buffer.Buffer(new Uint8Array(res.data));
            $scope.$emit('modelbuffer', buf);
        });
    });
})
.service('MdlNorms', function($http){
    var norms = []

    $http.get('/public/anorms.h').then(function(res){
        lines = res.data.split('\n');
        for (var i=0; i<lines.length; i++) {
            var pattern = /^\{\s*(.*)f,\s*(.*)f,\s*(.*)f\s*\}\s*,\s*$/
            var match = lines[i].match(pattern);
            if (match) {
                norms.push([
                    parseFloat(match[1]),
                    parseFloat(match[2]),
                    parseFloat(match[3])
                ]);
            }
        }
    });

    return norms;
})
.run(($rootScope, Mdl) => {
    $rootScope.toolState = {
        $name: 'single',
        get: () => $rootScope.toolState.$name,
        set: (name) => $rootScope.toolState.$name = name
    }
    $rootScope.$on('modelbuffer', (evt, buf) => {
        $rootScope.model = Mdl.fromBuffer(buf);
        $rootScope.frame = 0;
    })
});
