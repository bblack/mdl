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

    $scope.$watchGroup(['camx', 'camy', 'camz'], function(newVal){
        $scope.$broadcast('redraw', newVal)
    })
});

m.service('Vec3', function(){
    var Vec3 = function(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Vec3.prototype.dot = function(b) {
        var a = this;
        if (Vec3.prototype.isPrototypeOf(a))
            a = [a.x, a.y, a.z];
        if (Vec3.prototype.isPrototypeOf(b))
            b = [b.x, b.y, b.z];
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }

    Vec3.prototype.timesScalar = function(n) {
        var v = this;
        if (Vec3.prototype.isPrototypeOf(v))
            v = [v.x, v.y, v.z];
        return new Vec3(n*v[0], n*v[1], n*v[2]);
    }

    Vec3.prototype.applyAffineTransform = function(m) {
        var x = this.x, y = this.y, z = this.z;
        // this is a column vector
        return new Vec3(
            x*m[0][0] + y*m[0][1] + z*m[0][1] + m[0][3],
            x*m[1][0] + y*m[1][1] + z*m[1][2] + m[1][3],
            x*m[2][0] + y*m[2][1] + z*m[2][2] + m[2][3]
        );
    }

    Vec3.prototype.minus = function(v) {
        return new Vec3(
            this.x - v.x,
            this.y - v.y,
            this.z - v.z
        );
    }

    Vec3.prototype.norm = function(){
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2) +
            Math.pow(this.z, 2));
    }

    return Vec3;
});

m.directive('projection', function(){
    return {
        restrict: 'E',
        template: "<canvas style='width: 100%; height: 100%;'></canvas>",
        link: function($scope, $element){
            var redraw = function(){
                if (!$scope.model) { return; }

                var model = $scope.model;
                var canvas = $element.find('canvas')[0];
                var ctx = canvas.getContext('2d');
                ctx.canvas.width = $scope.w;
                ctx.canvas.height = $scope.h;

                ctx.clearRect(0, 0, $scope.w, $scope.h);

                ctx.lineWidth = .5;
                ctx.strokeStyle = '#e0e0e0';

                model.triangles.forEach(function(tri, triIndex){
                    [0,1,2].forEach(function(cornerIndex){
                        var vertIndex = tri.vertIndeces[cornerIndex];
                        var vertIndexB = tri.vertIndeces[(cornerIndex + 1) % 3]

                        var vertA = model.frames[$scope.frame].simpleFrame.verts[vertIndex];
                        var vertB = model.frames[$scope.frame].simpleFrame.verts[vertIndexB];

                        ctx.moveTo.apply(ctx, $scope.project(vertA));
                        ctx.lineTo.apply(ctx, $scope.project(vertB));
                    });
                });

                ctx.stroke();
            };

            var invalidateSize = function(){
                $scope.w = $element.width() * window.devicePixelRatio;
                $scope.h = $element.height() * window.devicePixelRatio;
                redraw();
            };

            invalidateSize();

            $scope.$watchGroup(['model', 'frame'], function(){
                redraw();
            });

            $(window).resize(function(){
                invalidateSize();
            });

            $scope.$on('redraw', function(){
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
        }
    };
});

m.directive('perspectiveProjection', function(Vec3){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            frame: '=',
            camPos: '=',
            camDir: '='
        },
        template: '<projection></projection>',
        link: function($scope, $element) {
            var worldToCameraMatrix = [
                [1, 0, 0, -150],
                [0, 1, 0, -400],
                [0, 0, 1, -250]
            ];

            $scope.$on('redraw', function(evt, cam){
                worldToCameraMatrix[0][3] = parseInt(cam[0]);
                worldToCameraMatrix[1][3] = parseInt(cam[1]);
                worldToCameraMatrix[2][3] = parseInt(cam[2]);
            })

            $scope.$watchGroup(['camPos', 'camDir'], function(){
                // update worldToCameraMatrix
            })

            $scope.project = function(p) {
                // transform from world space to camera space
                p = Vec3.prototype.applyAffineTransform.call(p, worldToCameraMatrix);

                var projectedPoint = [
                    ((p.x / p.y)) / (Math.PI/4) * $scope.w/2 + $scope.w/2,
                    ((p.z / p.y)) / (Math.PI/4) * $scope.h/2 + $scope.h/2
                ];



                return projectedPoint;
            }

        }
    };
});
