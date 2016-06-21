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
        $rootScope.model = res.data;
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
            pos: '=',
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
                angles: [Math.PI*14/10, Math.PI/2],
                pos: [0, 100, -250]
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
            var zNear = 50;
            var zFar = 400;
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
                    lineSegWorld[1][i] = 100;
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
            function signedParArea2(a, b, c){ // basically ||(b-a) x (c-b)||
                return (c[0] - a[0])*(b[1] - a[1]) - (c[1] - a[1])*(b[0] - a[0]);
            }
            function calcZAndWriteToZBufIfLower(w0, w1, w2, screenVerts, w, y, x, stVerts, facesFront, skin){
                // the determinants are proportional baryweights, which sum to 1, so:
                var wsum = w0 + w1 + w2;
                var baryweights = [w0 / wsum, w1 / wsum, w2 / wsum];
                // interp p.z from vert z's
                var z = baryweights[0]*screenVerts[0][2] +
                    baryweights[1]*screenVerts[1][2] +
                    baryweights[2]*screenVerts[2][2];
                z *= 255;
                var zbufindex = 4*(w * y + x);
                var skinwidth = 296;
                if (z < zbuf[zbufindex]) {
                    zbuf.fill(z, zbufindex, zbufindex + 3);
                    var s = 0;
                    var t = 0;
                    for (var i=0; i<3; i++) {
                        s += baryweights[i] * stVerts[i].s;
                        if (!facesFront && stVerts[i].onSeam) {
                            s += baryweights[i]*skinwidth/2;
                        }
                        t += baryweights[i] * stVerts[i].t;
                    }
                    var colorindex = skin[Math.floor(t)*skinwidth + Math.floor(s)];
                    var color = $scope.$root.palette[colorindex];
                    fbuf.set(color, zbufindex);
                }
            }
            function getbbox(sv){ // screenverts
                return {
                    xmin: Math.floor(Math.min(sv[0][0], sv[1][0], sv[2][0])),
                    xmax: Math.ceil(Math.max(sv[0][0], sv[1][0], sv[2][0])),
                    ymin: Math.floor(Math.min(sv[0][1], sv[1][1], sv[2][1])),
                    ymax: Math.ceil(Math.max(sv[0][1], sv[1][1], sv[2][1]))
                };
            }
            function rasterize(w, h, screenVerts, stVerts, facesFront, skin){
                var bbox = getbbox(screenVerts); // then clip to screen:
                var xmin = Math.max(bbox.xmin, 0);
                var xmax = Math.min(bbox.xmax, w);
                var ymin = Math.max(bbox.ymin, 0);
                var ymax = Math.min(bbox.ymax, h);
                // TODO: 2nd bottleneck is rasterize itself (behind calcZAnd...)
                // which means our options for speedups are:
                // loop fewer times
                // single loop instead of nested
                // allocate less
                // tackle for-condition checking?
                // * clip bbox before looping?
                // ??
                for (var x = xmin; x < xmax; x++) {
                    for (var y = ymin; y < ymax; y++) {
                        var p = [x, y];
                        var w0 = signedParArea2(screenVerts[1], screenVerts[2], p);
                        var w1 = signedParArea2(screenVerts[2], screenVerts[0], p);
                        var w2 = signedParArea2(screenVerts[0], screenVerts[1], p);
                        if (w0 >= 0 && w1 >= 0 && w2 >= 0) { // p in screen tri?
                            calcZAndWriteToZBufIfLower(w0, w1, w2, screenVerts,
                                w, y, x, stVerts, facesFront, skin);
                        }
                    }
                }
            }
            function render(){
                var start = Date.now();
                var ctx = canvas.getContext('2d');
                zbuf.fill(255);
                fbuf.fill(255);
                _.each(scene.entities, (e) => {
                    var frame = e.model.frames[$scope.frame].simpleFrame;
                    var objToWorldMatrix = [
                        [1, 0, 0, -e.pos[0]],
                        [0, 1, 0, -e.pos[1]],
                        [0, 0, 1, -e.pos[2]]
                    ]
                    _.each(e.model.triangles, function rasterizeTri(tri){
                        var screenVerts = new Array(3);
                        var stVerts = new Array(3);
                        for (var i=0; i<3; i++) {
                            var vertIndex = tri.vertIndeces[i];
                            var vert = frame.verts[vertIndex];
                            vert = new Vec3(vert.x, vert.y, vert.z);
                            vert = vert.applyAffineTransform(objToWorldMatrix);
                            screenVerts[i] = worldToCanvas(vert);
                            stVerts[i] = e.model.texCoords[vertIndex];
                        }
                        rasterize(canvas.width, canvas.height, screenVerts, stVerts,
                            tri.facesFront, e.model.skins[0].data.data);
                    })
                })
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // fbuf.set(zbuf, 0);
                ctx.putImageData(new ImageData(fbuf, canvas.width, canvas.height), 0, 0);
                drawAxes(ctx);
                recordRenderTime(Date.now() - start);
                drawFps(ctx);
                window.requestAnimationFrame(render);
            }
            window.requestAnimationFrame(render);
            $scope.$watchGroup(['model', 'frame', 'pos'], (newvals) => {
                if (!newvals[0]) return;
                scene.entities = [{model: newvals[0], frame: newvals[1], pos: newvals[2]}];
            });
        }
    }
})
