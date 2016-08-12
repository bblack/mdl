angular.module('mdlr')
.directive('perspectiveProjection', function(){
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
            mv: '='
        },
        template: `<canvas ng-mousemove="mousemove($event)"
            ng-mousedown="mousedown($event)"
            ></canvas>`,
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
            var pitch = 0;
            var yaw = 0;
            var lastScreenPos;
            $scope.mousedown = (evt) => {
                lastScreenPos = [evt.offsetX, evt.offsetY];
            }
            $scope.mousemove = (evt) => {
                if (evt.buttons & 1) {
                    var curScreenPos = [evt.offsetX, evt.offsetY];
                    pitch += (curScreenPos[1] - lastScreenPos[1]) * 0.02;
                    while (pitch > Math.PI*2) pitch -= Math.PI*2;
                    while (pitch < 0) pitch += Math.PI*2;
                    yaw += (curScreenPos[0] - lastScreenPos[0]) * 0.02;
                    while (yaw > Math.PI*2) yaw -= Math.PI*2;
                    while (yaw < 0) yaw += Math.PI*2;
                    setCamSpaceMatrix();
                }
                lastScreenPos = [evt.offsetX, evt.offsetY];
            }
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

            var shaderProgram = createModelShaderProgram(gl);
            gl.useProgram(shaderProgram);
            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);
            var vertexTexCoordAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoord");
            gl.enableVertexAttribArray(vertexTexCoordAttribute);

            function setCamSpaceMatrix(){
                var camSpaceMatrix = mat4.fromValues.apply(mat4, $scope.mv);
                mat4.rotate(camSpaceMatrix, camSpaceMatrix, pitch,
                    vec3.fromValues(1, 0, 0));
                mat4.rotate(camSpaceMatrix, camSpaceMatrix, yaw,
                    vec3.fromValues(0, 0, 1));
                gl.useProgram(axisShaderProgram);
                var axisCamMatrixU = gl.getUniformLocation(axisShaderProgram, 'camSpaceMatrix');
                gl.uniformMatrix4fv(axisCamMatrixU, false, new Float32Array(camSpaceMatrix));
                gl.useProgram(shaderProgram);
                var camSpaceMatrixU = gl.getUniformLocation(shaderProgram, 'camSpaceMatrix');
                gl.uniformMatrix4fv(camSpaceMatrixU, false, camSpaceMatrix);
            }
            setCamSpaceMatrix();

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
                    var frame = $scope.$root.frame; // waiting for propagation would be slower
                    var frame1 = Math.floor(frame);
                    var frame2 = mdl.frames.length == 1 ? frame1 :
                        (Math.floor(frame) + 1) % (mdl.frames.length - 1);
                    var lerp = frame - Math.floor(frame);
                    var frame1verts = mdl.frames[frame1].simpleFrame.verts;
                    var frame2verts = mdl.frames[frame2].simpleFrame.verts;
                    for (tri of mdl.triangles) {
                        for (var v=0; v<3; v++) {
                            var vert1 = frame1verts[tri.vertIndeces[v]];
                            var vert2 = frame2verts[tri.vertIndeces[v]];
                            var vert = {
                                x: (1-lerp)*vert1.x + lerp*vert2.x,
                                y: (1-lerp)*vert1.y + lerp*vert2.y,
                                z: (1-lerp)*vert1.z + lerp*vert2.z
                            };
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
            })
            $scope.$watchCollection('model.triangles', () => {
                var model = $scope.model;
                if (!model) return;
                bufferTexCoords(gl, texcoordsbuf, model.triangles,
                    model.texCoords, model.skinWidth, model.skinHeight);
            })
            $scope.$watch('model', (newval) => {
                if (!newval) return;
                scene.entities = [{model: newval}];
            });
        }
    }
})
