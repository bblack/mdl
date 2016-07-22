angular.module('mdlr', [])
.factory('Mdl', function(){
    function Mdl(obj){
        Object.assign(this, obj);
    }
    Mdl.prototype.addVert = function(x, y, z){
        this.texCoords.push({s: 0, t: 0, onSeam: 0});
        this.frames.forEach((f) => {
            f.simpleFrame.verts.push({x: x, y: y, z: z});
        });
        this.numVerts++;
    }
    return Mdl;
})
.controller('ControlsController', function($scope, $interval, $rootScope){
    $scope.TOOLS = ['single', 'sweep', 'move', 'addvert'];
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
.controller('QuadViewController', function($scope, $rootScope, $http, Mdl){
    $scope.selectedVerts = [];
    $http.get('palette')
    .then(function(res){
        $rootScope.palette = res.data;
        return $http.get('player.mdl')
        .then(function(res){
            var model = $rootScope.model = new Mdl(res.data);
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
.run(($rootScope) => {
    $rootScope.toolState = {
        $name: 'single',
        get: () => $rootScope.toolState.$name,
        set: (name) => $rootScope.toolState.$name = name
    }
});
