angular.module('mdlr', [])
.controller('ControlsController', function($scope, $interval, $rootScope){
    $scope.play = function(){
        if ($scope.playing) { return; }

        $scope.playing = $interval(function(){
            $rootScope.frame = ($rootScope.frame + 1) % $scope.model.frames.length;
        }, 100);
    };

    $scope.stop = function(){
        $interval.cancel($scope.playing);
        delete $scope.playing;
    };
})
.controller('QuadViewController', function($scope, $rootScope, $http){
    $scope.selectedVerts = [];
    $http.get('palette')
    .then(function(res){
        $rootScope.palette = res.data;
        return $http.get('player.mdl')
        .then(function(res){
            var model = $rootScope.model = res.data;
            _.each(model.frames, (f) => {
                _.each(f.simpleFrame.verts, (v) => {
                    v.x = v.x * model.scale[0] + model.translate[0];
                    v.y = v.y * model.scale[1] + model.translate[1];
                    v.z = v.z * model.scale[2] + model.translate[2];
                })
            })
            $rootScope.frame = 0;
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
                norms.push(new Vec3(
                    parseFloat(match[1]),
                    parseFloat(match[2]),
                    parseFloat(match[3])
                ));
            }
        }
    });

    return norms;
})
.directive('perspectiveProjection', function($interval, MdlNorms){
    function createAxisShaderProgram(gl){
        var axisvertshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(axisvertshader, `
            attribute vec3 aVertexPos;
            attribute vec3 aVertexColor;
            uniform mat4 matrix;
            uniform mat4 camSpaceMatrix;
            varying lowp vec4 vcolor;
            void main(void) {
                gl_Position = matrix * camSpaceMatrix * vec4(aVertexPos, 1.0);
                vcolor = vec4(aVertexColor, 0.0);
            }
        `);
        gl.compileShader(axisvertshader);
        if (!gl.getShaderParameter(axisvertshader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(axisvertshader));
        var axisfragshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(axisfragshader, `
            varying lowp vec4 vcolor;
            void main(void) {
                gl_FragColor = vcolor;
            }
        `);
        gl.compileShader(axisfragshader);
        if (!gl.getShaderParameter(axisfragshader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(axisfragshader));
        var axisShaderProgram = gl.createProgram();
        gl.attachShader(axisShaderProgram, axisvertshader);
        gl.attachShader(axisShaderProgram, axisfragshader);
        gl.linkProgram(axisShaderProgram);
        return axisShaderProgram;
    }
    function createModelShaderProgram(gl){
        // vert shader:
        var vertshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertshader, `
            attribute vec3 aVertexPosition;
            attribute vec2 aVertexTexCoord;
            uniform mat4 matrix;
            uniform mat4 camSpaceMatrix;
            varying highp vec2 vTexCoord;
            void main(void){
                gl_Position = matrix * camSpaceMatrix * vec4(aVertexPosition, 1.0);
                vTexCoord = aVertexTexCoord;
            }
        `);
        gl.compileShader(vertshader);
        if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vertshader));
        }
        // frag shader:
        var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragshader, `
            varying highp vec2 vTexCoord;
            uniform sampler2D uSampler;
            void main(void){
                gl_FragColor = texture2D(uSampler, vec2(vTexCoord.st));
            }
        `);
        gl.compileShader(fragshader);
        if (!gl.getShaderParameter(fragshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fragshader));
        }
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertshader);
        gl.attachShader(shaderProgram, fragshader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
    function bufferAxes(gl){
        var axesbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axesbuf);
        var axisverts = [ // x,y,z,r,g,b
            0, 0, 0, 1, 0, 0,
            10, 0, 0, 1, 0, 0,
            0, 0, 0, 0, 1, 0,
            0, 10, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 1,
            0, 0, 10, 0, 0, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisverts), gl.STATIC_DRAW);
        return axesbuf;
    }
    function drawAxes(gl, shaderProgram, buf, vPosAtt, vColorAtt){
        gl.useProgram(shaderProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(vPosAtt, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(vColorAtt, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawArrays(gl.LINES, 0, 6);
    }
    function loadModelTexture(gl, tex, width, height, pixels){
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        // these are required for non-power-of-2-size textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // NEAREST or LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    function bufferTexCoords(gl, buf, mdlTris, mdlTexCoords, width, height){
        var texcoords = [];
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        for (tri of mdlTris) {
            for (var v=0; v<3; v++) {
                var uv = mdlTexCoords[tri.vertIndeces[v]];
                texcoords.push((uv.s / width) +
                    ((!tri.facesFront && uv.onSeam) ? 0.5 : 0));
                texcoords.push(uv.t / height);
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    }
    return {
        restrict: 'E',
        scope: {
            model: '=',
            frame: '=',
            mv: '='
        },
        template: '<canvas></canvas>',
        link: function($scope, $element){
            var aspect;
            var $canvas = $element.find('canvas');
            var n = 1;
            var f = 100;
            var perspectiveMatrix;
            var scene = {
                entities: []
            };
            var gl = $canvas[0].getContext('webgl');
            function sizeCanvasToContainer(){
                var w = $element.width();
                var h = $element.height();
                aspect = w/h;
                $canvas.attr('width', w).attr('height', h);
                perspectiveMatrix = [
                    1/aspect, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, (f+n)/(f-n), 1,
                    0, 0, -(2*f*n)/(f-n), 0
                ];
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                gl.useProgram(axisShaderProgram);
                var axisMatrixUniform = gl.getUniformLocation(axisShaderProgram, 'matrix');
                gl.uniformMatrix4fv(axisMatrixUniform, false, new Float32Array(perspectiveMatrix));
                gl.useProgram(shaderProgram);
                var matrixUniform = gl.getUniformLocation(shaderProgram, 'matrix');
                gl.uniformMatrix4fv(matrixUniform, false, new Float32Array(perspectiveMatrix));
            }
            $(window).on('resize', sizeCanvasToContainer);
            gl.enable(gl.DEPTH_TEST);

            var axesbuf = bufferAxes(gl);
            var axisShaderProgram = createAxisShaderProgram(gl);
            gl.useProgram(axisShaderProgram);

            var axisvertexposatt = gl.getAttribLocation(axisShaderProgram, 'aVertexPos');
            gl.enableVertexAttribArray(axisvertexposatt);
            var axisvertcoloratt = gl.getAttribLocation(axisShaderProgram, 'aVertexColor');
            gl.enableVertexAttribArray(axisvertcoloratt);
            var camSpaceMatrix = $scope.mv;
            var axisCamMatrixU = gl.getUniformLocation(axisShaderProgram, 'camSpaceMatrix');
            gl.uniformMatrix4fv(axisCamMatrixU, false, new Float32Array(camSpaceMatrix));

            var shaderProgram = createModelShaderProgram(gl);
            gl.useProgram(shaderProgram);
            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);
            var vertexTexCoordAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoord");
            gl.enableVertexAttribArray(vertexTexCoordAttribute);
            var camSpaceMatrixU = gl.getUniformLocation(shaderProgram, 'camSpaceMatrix');
            gl.uniformMatrix4fv(camSpaceMatrixU, false, camSpaceMatrix);
            // vertex buffer:
            var buf = gl.createBuffer();

            var tex = gl.createTexture();

            function render(){
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(shaderProgram);

                gl.activeTexture(gl.TEXTURE0); // w
                gl.bindTexture(gl.TEXTURE_2D, tex); // t
                gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uSampler'), 0); // f

                vertices = [];
                for (var ent of scene.entities) {
                    var mdl = ent.model;
                    var frameverts = mdl.frames[$scope.frame].simpleFrame.verts;
                    for (tri of mdl.triangles) {
                        for (var v=0; v<3; v++) {
                            var vert = frameverts[tri.vertIndeces[v]];
                            vertices.push(vert.x, vert.y, vert.z);
                        }
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsbuf);
                    gl.vertexAttribPointer(vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                    gl.useProgram(shaderProgram);
                    gl.drawArrays(gl.TRIANGLES, 0, mdl.triangles.length * 3);
                }
                drawAxes(gl, axisShaderProgram, axesbuf, axisvertexposatt, axisvertcoloratt);
                window.requestAnimationFrame(render);
            }
            window.requestAnimationFrame(render);

            sizeCanvasToContainer();
            var texcoordsbuf = gl.createBuffer();

            $scope.$watch('model', (model) => {
                if (!model) return;

                var pixels = new Uint8Array(model.skinWidth * model.skinHeight * 4);
                pixels.fill(0xff);
                model.skins[0].data.data.forEach((palidx, pixnum) => {
                    var rgb = $scope.$root.palette[palidx];
                    pixels.set(rgb, pixnum * 4);
                });
                loadModelTexture(gl, tex, model.skinWidth, model.skinHeight, pixels);
                bufferTexCoords(gl, texcoordsbuf, model.triangles,
                    model.texCoords, model.skinWidth, model.skinHeight);
            })
            $scope.$watchGroup(['model', 'frame'], (newvals) => {
                if (!newvals[0]) return;
                scene.entities = [{model: newvals[0], frame: newvals[1]}];
            });
        }
    }
})
.directive('orthoWireProjection', function($interval, MdlNorms){
    function createAxisShaderProgram(gl){
        var axisvertshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(axisvertshader, `
            attribute vec3 aVertexPos;
            attribute vec3 aVertexColor;
            uniform mat4 matrix;
            uniform mat4 camSpaceMatrix;
            varying lowp vec4 vcolor;
            void main(void) {
                gl_Position = matrix * camSpaceMatrix * vec4(aVertexPos, 1.0);
                vcolor = vec4(aVertexColor, 0.0);
            }
        `);
        gl.compileShader(axisvertshader);
        if (!gl.getShaderParameter(axisvertshader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(axisvertshader));
        var axisfragshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(axisfragshader, `
            varying lowp vec4 vcolor;
            void main(void) {
                gl_FragColor = vcolor;
            }
        `);
        gl.compileShader(axisfragshader);
        if (!gl.getShaderParameter(axisfragshader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(axisfragshader));
        var axisShaderProgram = gl.createProgram();
        gl.attachShader(axisShaderProgram, axisvertshader);
        gl.attachShader(axisShaderProgram, axisfragshader);
        gl.linkProgram(axisShaderProgram);
        return axisShaderProgram;
    }
    function createModelShaderProgram(gl){
        var vertshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertshader, `
            attribute vec3 aVertexPosition;
            uniform mat4 matrix;
            uniform mat4 camSpaceMatrix;
            void main(void){
                gl_Position = matrix * camSpaceMatrix * vec4(aVertexPosition, 1.0);
            }
        `);
        gl.compileShader(vertshader);
        if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vertshader));
        }
        var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragshader, `
            void main(void){
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
        `);
        gl.compileShader(fragshader);
        if (!gl.getShaderParameter(fragshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fragshader));
        }
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertshader);
        gl.attachShader(shaderProgram, fragshader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
    function createSelectedVertShaderProgram(gl){
        var vertshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertshader, `
            attribute vec3 aVertPos;
            uniform mat4 projMatrix;
            uniform mat4 camSpaceMatrix;
            void main(void){
                gl_Position = projMatrix * camSpaceMatrix * vec4(aVertPos, 1.0);
                gl_PointSize = 8.0;
            }
        `);
        gl.compileShader(vertshader);
        if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vertshader));
        }
        var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragshader, `
            void main(void){
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
        `);
        gl.compileShader(fragshader);
        if (!gl.getShaderParameter(fragshader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fragshader));
        }
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertshader);
        gl.attachShader(shaderProgram, fragshader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
    function bufferAxes(gl){
        var axesbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, axesbuf);
        var axisverts = [ // x,y,z,r,g,b
            0, 0, 0, 1, 0, 0,
            10, 0, 0, 1, 0, 0,
            0, 0, 0, 0, 1, 0,
            0, 10, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 1,
            0, 0, 10, 0, 0, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisverts), gl.STATIC_DRAW);
        return axesbuf;
    }
    function drawAxes(gl, shaderProgram, buf, vPosAtt, vColorAtt){
        gl.useProgram(shaderProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(vPosAtt, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(vColorAtt, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawArrays(gl.LINES, 0, 6);
    }
    function drawSelectedVerts(gl, shaderProgram, buf, vertPosAtt, numPoints){
        gl.useProgram(shaderProgram);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(vertPosAtt, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.POINTS, numPoints, gl.UNSIGNED_SHORT, 0);
    }
    return {
        restrict: 'E',
        scope: {
            model: '=',
            frame: '=',
            mv: '=',
            selectedVerts: '='
        },
        template: `<canvas
            ng-mousedown="onCanvasMousedown($event)"
            ng-mouseup="onCanvasMouseup($event)"
            ng-mousemove="onCanvasMousemove($event)"></canvas>`,
        link: function($scope, $element){
            var aspect;
            var zoom = 1/40;
            var $canvas = $element.find('canvas');
            $canvas.on('wheel', (evt) => {
                zoom *= Math.pow(1.1, evt.originalEvent.deltaY / 10);
                sizeCanvasToContainer(); // overkill for setting zoom
            })
            var n = -100;
            var f = 100;
            var projectionMatrix;
            var camSpaceMatrix = $scope.mv;
            var scene = {
                entities: []
            };
            var gl = $canvas[0].getContext('webgl');
            function sizeCanvasToContainer(){
                var w = $element.width();
                var h = $element.height();
                aspect = w/h;
                $canvas.attr('width', w).attr('height', h);
                projectionMatrix = [
                    zoom/aspect, 0, 0, 0,
                    0, zoom, 0, 0,
                    0, 0, -2/(f-n), 0,
                    0, 0, -(f+n)/(f-n), 1.0
                ];
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                gl.useProgram(svShaderProgram);
                var svProjMatrixU = gl.getUniformLocation(svShaderProgram, 'projMatrix');
                gl.uniformMatrix4fv(svProjMatrixU, false, new Float32Array(projectionMatrix));
                gl.useProgram(axisShaderProgram);
                var axisMatrixUniform = gl.getUniformLocation(axisShaderProgram, 'matrix');
                gl.uniformMatrix4fv(axisMatrixUniform, false, new Float32Array(projectionMatrix));
                gl.useProgram(shaderProgram);
                var matrixUniform = gl.getUniformLocation(shaderProgram, 'matrix');
                gl.uniformMatrix4fv(matrixUniform, false, new Float32Array(projectionMatrix));
            }
            function getClosestVert(x, y){
                var cursorNDC = [
                    x / $canvas.width() * 2 - 1,
                    -(y / $canvas.height() * 2 - 1)
                ];
                var closestVertDist = Infinity;
                var closestVertIndex;
                for (var ent of scene.entities) {
                    var verts = ent.model.frames[$scope.frame].simpleFrame.verts;
                    for (var i=0; i<verts.length; i++) {
                        var vert = verts[i];
                        var vertNDC = [vert.x, vert.y, vert.z, 1];
                        vec4.transformMat4(vertNDC, vertNDC, camSpaceMatrix);
                        vec4.transformMat4(vertNDC, vertNDC, projectionMatrix);
                        vertNDC = [
                            vertNDC[0] / vertNDC[3],
                            vertNDC[1] / vertNDC[3],
                            vertNDC[2] / vertNDC[3]
                        ];
                        var dist = Math.pow(cursorNDC[0] - vertNDC[0], 2) +
                            Math.pow(cursorNDC[1] - vertNDC[1], 2);
                        if (dist < closestVertDist) {
                            closestVertDist = dist;
                            closestVertIndex = i;
                        }
                    }
                }
                return closestVertIndex;
            }

            $(window).on('resize', sizeCanvasToContainer);

            var selectedVertIndexBuf = gl.createBuffer();
            $scope.onCanvasMousemove = (evt) => {
                if (movingFrom) {
                    var fromScr = movingFrom;
                    var toScr = [evt.offsetX, evt.offsetY];
                    var fromNDC = [
                        fromScr[0] / $canvas.width() * 2 - 1,
                        fromScr[1] / $canvas.height() * -2 + 1, // flip Y dir!
                        0, // near plane is +1!
                        1 // w
                    ];
                    var toNDC = [
                        toScr[0] / $canvas.width() * 2 - 1,
                        toScr[1] / $canvas.height() * -2 + 1, // flip Y dir!
                        0, // near plane is +1!
                        1 // w
                    ];
                    var invProjMat = mat4.create();
                    mat4.invert(invProjMat, projectionMatrix);
                    var fromCam = vec4.create();
                    var toCam = vec4.create();
                    vec4.transformMat4(fromCam, fromNDC, invProjMat);
                    vec4.transformMat4(toCam, toNDC, invProjMat);
                    var invCamSpaceMat = mat4.create();
                    mat4.invert(invCamSpaceMat, camSpaceMatrix);
                    var fromObj = vec4.create();
                    var toObj = vec4.create();
                    vec4.transformMat4(fromObj, fromCam, invCamSpaceMat);
                    vec4.transformMat4(toObj, toCam, invCamSpaceMat);
                    var delta = vec4.create();
                    vec4.subtract(delta, toObj, fromObj);
                    console.log('delta:', delta)
                    // vec4.scale(delta, delta, 40);
                    $scope.selectedVerts.forEach((vertIndex) => {
                        var vert = $scope.model.frames[$scope.frame].simpleFrame.verts[vertIndex];
                        vert.x += delta[0];
                        vert.y += delta[1];
                        vert.z += delta[2];
                    });
                    movingFrom = [evt.offsetX, evt.offsetY];
                } else if (evt.buttons === 0) {
                    var closestVertIndex = getClosestVert(evt.offsetX, evt.offsetY);
                    $scope.selectedVerts.length = 0;
                    $scope.selectedVerts.push(closestVertIndex);
                }
            };
            var movingFrom;
            $scope.onCanvasMousedown = (evt) => {
                movingFrom = [evt.offsetX, evt.offsetY];
                // and stop playing? or prevent this if playing?
            }
            $scope.onCanvasMouseup = (evt) => {
                movingFrom = null;
            }
            // gl.enable(gl.DEPTH_TEST);

            var svShaderProgram = createSelectedVertShaderProgram(gl);
            gl.useProgram(svShaderProgram);
            var svPosAtt = gl.getAttribLocation(svShaderProgram, 'aVertPos');
            gl.enableVertexAttribArray(svPosAtt);
            var svCamSpaceMatrixU = gl.getUniformLocation(svShaderProgram, 'camSpaceMatrix');
            gl.uniformMatrix4fv(svCamSpaceMatrixU,  false, new Float32Array(camSpaceMatrix));

            var axesbuf = bufferAxes(gl);
            var axisShaderProgram = createAxisShaderProgram(gl);
            gl.useProgram(axisShaderProgram);
            var axisvertexposatt = gl.getAttribLocation(axisShaderProgram, 'aVertexPos');
            gl.enableVertexAttribArray(axisvertexposatt);
            var axisvertcoloratt = gl.getAttribLocation(axisShaderProgram, 'aVertexColor');
            gl.enableVertexAttribArray(axisvertcoloratt);
            var axisCamMatrixU = gl.getUniformLocation(axisShaderProgram, 'camSpaceMatrix');
            gl.uniformMatrix4fv(axisCamMatrixU, false, new Float32Array(camSpaceMatrix));

            var shaderProgram = createModelShaderProgram(gl);
            gl.useProgram(shaderProgram);
            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);
            var camSpaceMatrixU = gl.getUniformLocation(shaderProgram, 'camSpaceMatrix');
            gl.uniformMatrix4fv(camSpaceMatrixU, false, camSpaceMatrix);
            // vertex buffer:
            var buf = gl.createBuffer();

            function render(){
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(shaderProgram);

                vertices = [];
                for (var ent of scene.entities) {
                    var mdl = ent.model;
                    var frameverts = mdl.frames[$scope.frame].simpleFrame.verts;
                    for (vert of frameverts) {
                        vertices.push(vert.x, vert.y, vert.z);
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
                    gl.drawElements(gl.LINES, mdl.triangles.length * 3 * 2, gl.UNSIGNED_SHORT, 0);
                }
                drawSelectedVerts(gl, svShaderProgram, selectedVertIndexBuf,
                    svPosAtt, $scope.selectedVerts.length);
                drawAxes(gl, axisShaderProgram, axesbuf, axisvertexposatt, axisvertcoloratt);
                window.requestAnimationFrame(render);
            }
            window.requestAnimationFrame(render);

            sizeCanvasToContainer();

            var vertIndexBuffer = gl.createBuffer();
            $scope.$watchGroup(['model', 'frame'], (newvals) => {
                if (!newvals[0]) return;
                scene.entities = [{model: newvals[0], frame: newvals[1]}];
            });
            $scope.$watch('model', (model) => {
                if (!model) return;
                var vertIndeces = [];
                for (var tri of model.triangles) {
                    vertIndeces.push(tri.vertIndeces[0], tri.vertIndeces[1],
                        tri.vertIndeces[1], tri.vertIndeces[2],
                        tri.vertIndeces[2], tri.vertIndeces[0]);
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertIndeces), gl.STATIC_DRAW);
            });
            $scope.$watchCollection('selectedVerts', (newval) => {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, selectedVertIndexBuf);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newval), gl.STATIC_DRAW);
            });
        }
    }
})
