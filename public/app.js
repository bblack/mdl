function mean(vals){
    var sum = 0;
    for (i in vals) {
        sum += vals[i];
    }
    return sum / vals.length;
}
function m33timesm33(m1, m2){
    return [
        [
            Vec3.fromArray(m1[0]).dot([m2[0][0], m2[0][1], m2[0][2]]),
            Vec3.fromArray(m1[0]).dot([m2[1][0], m2[1][1], m2[1][2]]),
            Vec3.fromArray(m1[0]).dot([m2[2][0], m2[2][1], m2[2][2]]),
        ],
        [
            Vec3.fromArray(m1[1]).dot([m2[0][0], m2[0][1], m2[0][2]]),
            Vec3.fromArray(m1[1]).dot([m2[1][0], m2[1][1], m2[1][2]]),
            Vec3.fromArray(m1[1]).dot([m2[2][0], m2[2][1], m2[2][2]]),
        ],
        [
            Vec3.fromArray(m1[2]).dot([m2[0][0], m2[0][1], m2[0][2]]),
            Vec3.fromArray(m1[2]).dot([m2[1][0], m2[1][1], m2[1][2]]),
            Vec3.fromArray(m1[2]).dot([m2[2][0], m2[2][1], m2[2][2]]),
        ]
    ]
}

m = angular.module('mdlr', []);

m.controller('ControlsController', function($scope, $interval, $rootScope){
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
});

m.controller('QuadViewController', function($scope, $rootScope, $http){
    $http.get('player.mdl')
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
    $http.get('palette')
    .then(function(res){
        $rootScope.palette = res.data;
    });
    $scope.camPos = [0, -150, -100];
});

m.service('MdlNorms', function($http){
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
});

function vecDotVec(v1, v2){
    var out = 0;
    for (var i=0; i<v1.length; i++) {
        out += v1[i] * v2[i];
    }
    return out;
}

function vecTimesMatrix(v, m){
    var out = new Array(m.length);
    for (var i=0; i<m.length; i++) {
        out[i] = vecDotVec(m[i], v);
    }
    return out;
}

function homog4dTo3d(h) {
    return [h[0] / h[3], h[1] / h[3], h[2] / h[3]]
}

m.directive('projection', function(){
    return {
        restrict: 'E',
        template: "<canvas style='width: 100%; height: 100%;'></canvas>",
        link: function($scope, $element){
            $scope.fill = true;
            var lightDir = new Vec3(0, 0, -1).normalized(); // top down

            var canvas = $element.find('canvas')[0];

            var defaultOrderTris = function(m) { return m.triangles; }

            var draw = function(){
                if (!$scope.model) { return; }

                var model = $scope.model;
                var ctx = canvas.getContext('2d');

                ctx.clearRect(0, 0, $scope.w, $scope.h);
                ctx.lineWidth = .5;
                ctx.strokeStyle = '#e0e0e0';
                ctx.fillStyle = '#e0e0e0';

                var orderTriangles = $scope.orderTriangles || defaultOrderTris;
                var triangles = orderTriangles(model, $scope.frame);

                _.each(triangles, (tri) => {
                    var verts = [];

                    ctx.beginPath();
                    _.each(tri.vertIndeces, (vertIndex, i) => {
                        var vert = model.frames[$scope.frame].simpleFrame.verts[vertIndex];
                        verts.push(new Vec3(vert.x, vert.y, vert.z));
                        ctx[i == 0 ? 'moveTo' : 'lineTo'].apply(ctx, $scope.project(vert));
                    })
                    ctx.closePath();

                    if ($scope.fill) {
                        var surfaceNormal = verts[1].minus(verts[0])
                            .cross(verts[2].minus(verts[0]))
                            .normalized();
                        var light = surfaceNormal.dot(lightDir) * 0.5 + 0.5; // 0 to 1
                        var lightByte = (Math.floor(light * 255)).toString(16);
                        if (lightByte.length == 1) lightByte = '0' + lightByte;
                        ctx.fillStyle = '#' + lightByte + lightByte + lightByte;
                        ctx.fill();
                    } else {
                        ctx.stroke();
                    }
                })
            };

            var redraw = $scope.redraw = function(){
                window.requestAnimationFrame(draw);
            };

            var invalidateSize = function(){
                canvas.width = $scope.w = $element.width() * window.devicePixelRatio;
                canvas.height = $scope.h = $element.height() * window.devicePixelRatio;
                redraw();
            };

            invalidateSize();

            $(window).resize(function(){
                invalidateSize();
            });

            $scope.$watchGroup(['model', 'frame'], function(){
                redraw();
            });
        }
    };
});

m.directive('linearProjection', function(){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            frame: '=',
            projectionMatrix: '='
        },
        template: '<projection></projection>',
        link: function($scope, $element) {
            $scope.project = function(p) {
                var m = $scope.projectionMatrix;
                // p is a column vector i guess
                var projectedPoint = [
                    p.x*m[0][0] + p.y*m[0][1] + p.z*m[0][2] + m[0][3],
                    p.x*m[1][0] + p.y*m[1][1] + p.z*m[1][2] + m[1][3]
                ];
                return projectedPoint;
            };

            var camDir;

            $scope.orderTriangles = function(model, frameIndex) {
                var tris = model.triangles;
                var frame = model.frames[$scope.frame].simpleFrame;

                return _.sortBy(tris, function(tri){
                    var verts = [];

                    for (var i = 0; i < 3; i++) {
                        var vertIndex = tri.vertIndeces[i];
                        var vert = frame.verts[vertIndex];
                        verts.push(new Vec3(vert.x, vert.y, vert.z));
                    }

                    var centroid = Vec3.centroid(verts);
                    var distanceFromCamera = -1 * centroid.dot(camDir);
                    return distanceFromCamera;
                });
            }

            $scope.$watch('projectionMatrix', function(m){
                camDir = new Vec3(m[0][0], m[0][1], m[0][2]).cross(
                    new Vec3(m[1][0], m[1][1], m[1][2])
                );
            }, true);
        }
    };
});

m.directive('perspectiveProjection', function($interval, MdlNorms){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            frame: '=',
            camPos: '='
        },
        template: '<canvas></canvas>',
        link: function($scope, $element){
            var zbuf;
            var fbuf;
            function sizeCanvasToContainer(){
                var w = $element.width();
                var h = $element.height();
                $element.find('canvas').attr('width', w).attr('height', h);
                // giving 4 bytes per pixel is 4x as much space as is necessary--but it's
                // worth it for a huge speedup in drawing it to the framebuffer
                zbuf = new Uint8ClampedArray(4*w*h);
                fbuf = new Uint8ClampedArray(4*w*h);
            }
            sizeCanvasToContainer();
            $(window).on('resize', sizeCanvasToContainer);
            var scene = {
                entities: []
            };
            var cam = {
                // all 0s means looking along Z+ (with Y+ up and X+ right)
                angles: [3*Math.PI/2, Math.PI/2],
                pos: [0, 0, -50]
            };
            var yaw = cam.angles[0];
            var yawMatrix = [
                [Math.cos(yaw), 0, -Math.sin(yaw)],
                [0, 1, 0],
                [Math.sin(yaw), 0, Math.cos(yaw)]
            ];
            var pitch = cam.angles[1];
            var pitchMatrix = [
                [1, 0, 0],
                [0, Math.cos(pitch), -Math.sin(pitch)],
                [0, Math.sin(pitch), Math.cos(pitch)]
            ];
            var worldToCameraRotMatrix = m33timesm33(yawMatrix, pitchMatrix);
            // TODO: this rotates the world, then translates it--it should do the opposite
            var worldToCameraMatrix = [
                worldToCameraRotMatrix[0].concat(-cam.pos[0]),
                worldToCameraRotMatrix[1].concat(-cam.pos[1]),
                worldToCameraRotMatrix[2].concat(-cam.pos[2])
            ];
            var zNear = -2;
            var zFar = 2;
            var camToClipMatrix = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, zFar / (zFar - zNear), zFar * -zNear / (zFar - zNear)],
                [0, 0, 1, 0]
            ];
            var canvas = $element.find('canvas')[0];
            var renderTimes = [];
            function recordRenderTime(t){
                renderTimes.push(t);
                while (renderTimes.length > 10) renderTimes.shift();
            }
            function drawFps(ctx){
                ctx.fillStyle = 'red';
                ctx.font = '10px sans-serif';
                var fpstext = Math.floor(1000 / mean(renderTimes)).toString();
                ctx.fillText(fpstext, 10, 20);
            }
            function worldToCanvas(vert){
                vert = vert.applyAffineTransform(worldToCameraMatrix);
                var vertHomog = [vert.x, vert.y, vert.z, 1];
                vertHomog = vecTimesMatrix(vertHomog, camToClipMatrix);
                vert = homog4dTo3d(vertHomog);
                // clip space is x: [-1, 1], y: [-1, 1], z: [0, 1]
                vert = [
                    canvas.width / 2 * (vert[0] + 1),
                    canvas.height / 2 * (-vert[1] + 1),
                    vert[2]
                ];
                return vert;
            }
            function drawAxes(ctx){
                _.each(['red', 'green', 'blue'], (color, i) => {
                    var lineSegWorld = [[0, 0, 0], [0, 0, 0]];
                    lineSegWorld[1][i] = 10;
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    _.each(lineSegWorld, (vert, i) => {
                        vert = new Vec3(vert[0], vert[1], vert[2]);
                        vert = worldToCanvas(vert);
                        ctx[i == 0 ? 'moveTo' : 'lineTo'](vert[0], vert[1]);
                    })
                    ctx.stroke();
                    ctx.closePath();
                })
            }
            var gl = canvas.getContext('webgl');
            gl.enable(gl.DEPTH_TEST);
            // vert shader:
            var vertshader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertshader, `
                attribute vec3 aVertexPosition;
                uniform mat4 matrix;
                void main(void){
                    gl_Position = matrix * vec4(aVertexPosition, 1.0);
                }
            `);
            gl.compileShader(vertshader);
            if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(vertshader));
            }
            // frag shader:
            var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragshader, `
                void main(void){
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
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
            gl.useProgram(shaderProgram);
            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);
            var matrixUniform = gl.getUniformLocation(shaderProgram, 'matrix');
            // this identity matrix is an orthographic projection. if we change
            // it to perspective, we'll need to know the location of the near and
            // far z-clipping planes--this means we'll need a camera location, and
            // it definitely shouldn't be at the origin because that's about where
            // this model is located.
            gl.uniformMatrix4fv(matrixUniform, false, new Float32Array([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]));
            // vertex buffer:
            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            function render(){
                gl.clearColor(1, 1, 1, 1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                vertices = [
                    // -0.5, 0.5, 0.5,
                    // 0.5, 0.5, 0.0,
                    // 0.5, -0.5, 0.0,
                    // -0.5, -0.5, 0.5
                ];
                if (scene.entities[0]) {
                    var model = scene.entities[0].model;
                    var frameverts = scene.entities[0].model.frames[$scope.frame].simpleFrame.verts;
                    var vert;
                    for (tri of model.triangles) {
                        for (var v=0; v<3; v++) {
                            vertices.push(frameverts[tri.vertIndeces[v]].x/50);
                            vertices.push(frameverts[tri.vertIndeces[v]].y/50);
                            vertices.push(frameverts[tri.vertIndeces[v]].z/50);
                        }
                    }
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

                    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
                }
                window.requestAnimationFrame(render);
                return;
            }
            window.requestAnimationFrame(render);
            $scope.$watchGroup(['model', 'frame', 'pos'], (newvals) => {
                if (!newvals[0]) return;
                scene.entities = [{model: newvals[0], frame: newvals[1], pos: newvals[2]}];
            });
        }
    }
})
