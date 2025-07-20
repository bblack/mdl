import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { mat4, vec3, vec4 } from './components/gl-matrix/lib/gl-matrix.js';
import OrthoWireProjection from './OrthoWireProjection.jsx';

console.log('defining orthoWireProjection');
export default function(){

    return {
        restrict: 'E',
        scope: {
            model: '=',
            mv: '=',
            selectedVerts: '=',
            toolState: '=',
            frame: '='
        },
        template: `
          <canvas
              ng-mousedown="onCanvasMousedown($event)"
              ng-mouseup="onCanvasMouseup($event)"
              ng-mouseleave="onCanvasMouseleave($event)"
              ng-mousemove="onCanvasMousemove($event)"
          ></canvas>
        `,
        link: function($scope, $element){
          console.log('linking orthoWireProjection');

          const scene = {
            selectedVerts: $scope.selectedVerts
          };
          const container = $element[0];
          const reactRoot = createRoot(container);
          // ^ apparently you do this ONCE EVER on an element. the second time, you get this error in the console:
          //   > You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.

          const renderReactEl = (scene) => {
            console.log('rendering react element')
            const reactEl = React.createElement(
              OrthoWireProjection, // html el/react el
              { // attrs/params
                mv: $scope.mv,
                scene: scene,
                toolState: $scope.toolState
              },
              "" // contents/children
            )
            // or, as jsx: (<StrictMode><OrthoWireProjection /></StrictMode>)
            reactRoot.render(reactEl);
          }

          // $scope.$watch('frame', (x) => {
          //   debugger;
          //   $scope.frame = x;
          // });

          $scope.$watchCollection(
            () => {
              console.log('frame is now ' + $scope.$root.frame);
              return {
                model: $scope.model,
                frame: $scope.$root.frame,
                palette: $scope.$root.palette
              };
            },
            (o) => {
              const model = o.model;
              const frame = o.frame;
              const palette = o.palette;

              if (!model) return;
              if (!palette) return;

              scene.palette = palette;
              scene.entities = [
                {model: model, frame: frame}
              ];

              renderReactEl(scene);
            }
          );

          return;

            // -- old --

            // var aspect;
            // var zoom = 1/40;
            // var $canvas = $element.find('canvas');
            // $canvas.on('wheel', (evt) => {
            //     zoom *= Math.pow(1.1, -evt.originalEvent.deltaY / 10);
            //     sizeCanvasToContainer(); // overkill for setting zoom
            // })
            // var n = -100;
            // var f = 100;
            // var projectionMatrix;
            // var camSpaceMatrix = $scope.mv;
            // var scene = {
            //     entities: []
            // };
            // var gl = $canvas[0].getContext('webgl');
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            // function sizeCanvasToContainer(){
            //     var w = $element[0].clientWidth;
            //     var h = $element[0].clientHeight;
            //     aspect = w/h;
            //     $canvas.attr('width', w).attr('height', h);
            //     projectionMatrix = [
            //         zoom/aspect, 0, 0, 0,
            //         0, zoom, 0, 0,
            //         0, 0, -2/(f-n), 0,
            //         0, 0, -(f+n)/(f-n), 1.0
            //     ];
            //     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            //     gl.useProgram(vertShaderProgram);
            //     var vertProjMatrixU = gl.getUniformLocation(vertShaderProgram, 'projMatrix');
            //     gl.uniformMatrix4fv(vertProjMatrixU, false, new Float32Array(projectionMatrix));
            //     gl.useProgram(svShaderProgram);
            //     var svProjMatrixU = gl.getUniformLocation(svShaderProgram, 'projMatrix');
            //     gl.uniformMatrix4fv(svProjMatrixU, false, new Float32Array(projectionMatrix));
            //     gl.useProgram(axisShaderProgram);
            //     var axisMatrixUniform = gl.getUniformLocation(axisShaderProgram, 'matrix');
            //     gl.uniformMatrix4fv(axisMatrixUniform, false, new Float32Array(projectionMatrix));
            //     gl.useProgram(shaderProgram);
            //     var matrixUniform = gl.getUniformLocation(shaderProgram, 'matrix');
            //     gl.uniformMatrix4fv(matrixUniform, false, new Float32Array(projectionMatrix));
            // }
            // function worldToNDC(vert){
            //     var vertNDC = [vert.x, vert.y, vert.z, 1];
            //     vec4.transformMat4(vertNDC, vertNDC, camSpaceMatrix);
            //     vec4.transformMat4(vertNDC, vertNDC, projectionMatrix);
            //     return [
            //         vertNDC[0] / vertNDC[3],
            //         vertNDC[1] / vertNDC[3],
            //         vertNDC[2] / vertNDC[3]
            //     ];
            // }
            // function getClosestVert(x, y){
            //     var cursorNDC = [
            //         x / $canvas[0].clientWidth * 2 - 1,
            //         -(y / $canvas[0].clientHeight * 2 - 1)
            //     ];
            //     var closestVertDist = Infinity;
            //     var closestVertIndex;
            //     for (var ent of scene.entities) {
            //         var verts = ent.model.frames[Math.floor($scope.$root.frame)].simpleFrame.verts;
            //         for (var i=0; i<verts.length; i++) {
            //             var vert = verts[i];
            //             var vertNDC = worldToNDC(vert);
            //             var dist = Math.pow(cursorNDC[0] - vertNDC[0], 2) +
            //                 Math.pow(cursorNDC[1] - vertNDC[1], 2);
            //             if (dist < closestVertDist) {
            //                 closestVertDist = dist;
            //                 closestVertIndex = i;
            //             }
            //         }
            //     }
            //     return closestVertIndex;
            // }
            // function getVertsIn(x1, y1, x2, y2){
            //     var x1ndc = x1 / $canvas[0].clientWidth * 2 - 1;
            //     var y1ndc = y1 / $canvas[0].clientHeight * -2 + 1;
            //     var x2ndc = x2 / $canvas[0].clientWidth * 2 - 1;
            //     var y2ndc = y2 / $canvas[0].clientHeight * -2 + 1;
            //     var xlondc = Math.min(x1ndc, x2ndc);
            //     var xhindc = Math.max(x1ndc, x2ndc);
            //     var ylondc = Math.min(y1ndc, y2ndc);
            //     var yhindc = Math.max(y1ndc, y2ndc);
            //     var vertsHitIndeces = [];
            //     for (var ent of scene.entities) {
            //         var verts = ent.model.frames[Math.floor($scope.$root.frame)].simpleFrame.verts;
            //         for (var i=0; i<verts.length; i++) {
            //             var vertNDC = worldToNDC(verts[i]);
            //             if (vertNDC[0] > xlondc && vertNDC[0] < xhindc
            //                 && vertNDC[1] > ylondc && vertNDC[1] < yhindc) {
            //                 vertsHitIndeces.push(i);
            //             }
            //         }
            //     }
            //     return vertsHitIndeces;
            // }

            // window.addEventListener('resize', sizeCanvasToContainer);

            // var selectedVertIndexBuf = gl.createBuffer();
            // var sweepBoxVertBuf = gl.createBuffer();
            // var movingFrom;
            // function ndcToWorld(vNDC){
            //     var invProjMat = mat4.create();
            //     mat4.invert(invProjMat, projectionMatrix);
            //     var vCam = vec4.create();
            //     vec4.transformMat4(vCam, vNDC, invProjMat);
            //     var invCamSpaceMat = mat4.create();
            //     mat4.invert(invCamSpaceMat, camSpaceMatrix);
            //     var vWorld = vec4.create();
            //     vec4.transformMat4(vWorld, vCam, invCamSpaceMat);
            //     return vWorld;
            // }
            // function moveSelectedVerts(fromScr, toScr){
            //     var w = $canvas[0].clientWidth;
            //     var h = $canvas[0].clientHeight;
            //     var fromNDC = [fromScr[0]/w*2-1, fromScr[1]/h*-2+1, 0, 1];
            //     var toNDC = [toScr[0]/w*2-1, toScr[1]/h*-2+1, 0, 1];
            //     var fromObj = ndcToWorld(fromNDC);
            //     var toObj = ndcToWorld(toNDC);
            //     var delta = vec4.create();
            //     vec4.subtract(delta, toObj, fromObj);
            //     $scope.selectedVerts.forEach((vertIndex) => {
            //         var vert = $scope.model.frames[Math.floor($scope.$root.frame)].simpleFrame.verts[vertIndex];
            //         vert.x += delta[0];
            //         vert.y += delta[1];
            //         vert.z += delta[2];
            //     });
            // }
            // $scope.onCanvasMousemove = (evt) => {
            //     var fn = $scope.onCanvasMousemove[$scope.toolState.get()];
            //     return fn && fn(evt);
            // };
            // $scope.onCanvasMousemove['move.moving'] = (evt) => {
            //     var fromScr = movingFrom;
            //     var toScr = [evt.offsetX, evt.offsetY];
            //     moveSelectedVerts(fromScr, toScr);
            //     movingFrom = [evt.offsetX, evt.offsetY];
            // };
            // $scope.onCanvasMousemove['single'] = (evt) => {
            //     var closestVertIndex = getClosestVert(evt.offsetX, evt.offsetY);
            //     $scope.selectedVerts.length = 0;
            //     $scope.selectedVerts.push(closestVertIndex);
            // };
            // $scope.onCanvasMousemove['single.moving'] = (evt) => {
            //     var fromScr = movingFrom;
            //     var toScr = [evt.offsetX, evt.offsetY];
            //     moveSelectedVerts(fromScr, toScr);
            //     movingFrom = [evt.offsetX, evt.offsetY];
            // };
            // $scope.onCanvasMousemove['sweep.sweeping'] = (evt) => {
            //     var selectedVerts = getVertsIn(movingFrom[0], movingFrom[1],
            //         evt.offsetX, evt.offsetY);
            //     $scope.selectedVerts.length = 0;
            //     Array.prototype.push.apply($scope.selectedVerts, selectedVerts);
            //     gl.bindBuffer(gl.ARRAY_BUFFER, sweepBoxVertBuf);
            //     var fromNDC = [
            //         movingFrom[0] / $canvas[0].clientWidth * 2 - 1,
            //         movingFrom[1] / $canvas[0].clientHeight * -2 + 1
            //     ];
            //     var toNDC = [
            //         evt.offsetX / $canvas[0].clientWidth * 2 - 1,
            //         evt.offsetY / $canvas[0].clientHeight * -2 + 1
            //     ];
            //     var arr = [
            //         fromNDC[0], fromNDC[1], 0, // x, y, z NDC
            //         fromNDC[0], toNDC[1], 0,
            //         toNDC[0], toNDC[1], 0,
            //         toNDC[0], fromNDC[1], 0
            //     ];
            //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
            // }
            // $scope.onCanvasMousedown = (evt) => {
            //     var fn = $scope.onCanvasMousedown[$scope.toolState.get()];
            //     return fn && fn(evt);
            // }
            // var newtri;
            // ['addtri', 'addtri.vert2', 'addtri.vert3'].forEach((ts) => {
            //     $scope.onCanvasMousemove[ts] = (evt) => {
            //         var closestVertIndex = getClosestVert(evt.offsetX, evt.offsetY);
            //         $scope.selectedVerts.length = 0;
            //         $scope.selectedVerts.push(closestVertIndex);
            //     }
            // })
            // $scope.onCanvasMousedown['addtri'] = (evt) => {
            //     newtri = {facesFront: 0, vertIndeces: []};
            //     newtri.vertIndeces.push($scope.selectedVerts[0]);
            //     $scope.toolState.set('addtri.vert2')
            // }
            // $scope.onCanvasMousedown['addtri.vert2'] = (evt) => {
            //     newtri.vertIndeces.push($scope.selectedVerts[0]);
            //     $scope.toolState.set('addtri.vert3')
            // }
            // $scope.onCanvasMousedown['addtri.vert3'] = (evt) => {
            //     newtri.vertIndeces.push($scope.selectedVerts[0]);
            //     $scope.model.triangles.push(newtri);
            //     newtri = null;
            //     $scope.toolState.set('addtri');
            // }
            // $scope.onCanvasMousedown['addvert'] = (evt) => {
            //     var xNDC = evt.offsetX / $canvas[0].clientWidth * 2 - 1;
            //     var yNDC = evt.offsetY / $canvas[0].clientHeight * -2 + 1;
            //     var vNDC = vec4.fromValues(xNDC, yNDC, 0, 1);
            //     var vWorld = ndcToWorld(vNDC);
            //     $scope.model.addVert(vWorld[0], vWorld[1], vWorld[2]);
            // }
            // $scope.onCanvasMousedown['move'] = (evt) => {
            //     movingFrom = [evt.offsetX, evt.offsetY];
            //     $scope.toolState.set('move.moving');
            // }
            // $scope.onCanvasMousedown['single'] = (evt) => {
            //     movingFrom = [evt.offsetX, evt.offsetY];
            //     // and stop playing? or prevent this if playing?
            //     $scope.toolState.set('single.moving');
            // }
            // $scope.onCanvasMousedown['sweep'] = (evt) => {
            //     movingFrom = [evt.offsetX, evt.offsetY];
            //     $scope.toolState.set('sweep.sweeping');
            // }
            // $scope.onCanvasMouseup = (evt) => {
            //     var fn = $scope.onCanvasMouseup[$scope.toolState.get()];
            //     return fn && fn(evt);
            // }
            // $scope.onCanvasMouseup['move.moving'] = (evt) => {
            //     movingFrom = null;
            //     $scope.toolState.set('move');
            // }
            // $scope.onCanvasMouseup['single.moving'] = (evt) => {
            //     movingFrom = null;
            //     $scope.toolState.set('single');
            // }
            // $scope.onCanvasMouseup['sweep.sweeping'] = (evt) => {
            //     movingFrom = null;
            //     $scope.toolState.set('sweep');
            // }
            // $scope.onCanvasMouseleave = (evt) => {
            //     var fn = $scope.onCanvasMouseleave[$scope.toolState.get()];
            //     return fn && fn(evt);
            // }
            // $scope.onCanvasMouseup['move.moving'] = (evt) => {
            //     movingFrom = null;
            //     $scope.toolState.set('move');
            // }
            // $scope.onCanvasMouseleave['single.moving'] = (evt) => {
            //     movingFrom = null;
            //     $scope.toolState.set('single');
            // }

            // var sweepShaderProgram = createSweepShaderProgram(gl);
            // gl.useProgram(sweepShaderProgram);
            // var swPosAtt = gl.getAttribLocation(sweepShaderProgram, 'aVertPos');
            // gl.enableVertexAttribArray(swPosAtt);
            //
            // var svShaderProgram = createSelectedVertShaderProgram(gl);
            // gl.useProgram(svShaderProgram);
            // var svPosAtt = gl.getAttribLocation(svShaderProgram, 'aVertPos');
            // gl.enableVertexAttribArray(svPosAtt);
            // var svCamSpaceMatrixU = gl.getUniformLocation(svShaderProgram, 'camSpaceMatrix');
            // gl.uniformMatrix4fv(svCamSpaceMatrixU,  false, new Float32Array(camSpaceMatrix));
            //
            // var axesbuf = bufferAxes(gl);
            // var axisShaderProgram = createAxisShaderProgram(gl);
            // gl.useProgram(axisShaderProgram);
            // var axisvertexposatt = gl.getAttribLocation(axisShaderProgram, 'aVertexPos');
            // gl.enableVertexAttribArray(axisvertexposatt);
            // var axisvertcoloratt = gl.getAttribLocation(axisShaderProgram, 'aVertexColor');
            // gl.enableVertexAttribArray(axisvertcoloratt);
            // var axisCamMatrixU = gl.getUniformLocation(axisShaderProgram, 'camSpaceMatrix');
            // gl.uniformMatrix4fv(axisCamMatrixU, false, new Float32Array(camSpaceMatrix));
            //
            // var vertShaderProgram = createVertShaderProgram(gl);
            // gl.useProgram(vertShaderProgram);
            // var vertShader_aVertPos = gl.getAttribLocation(vertShaderProgram, 'aVertPos');
            // gl.enableVertexAttribArray(vertShader_aVertPos);
            // var vertCamSpaceMatrixU = gl.getUniformLocation(vertShaderProgram, 'camSpaceMatrix');
            // gl.uniformMatrix4fv(vertCamSpaceMatrixU, false, camSpaceMatrix);
            // var vertBuf = gl.createBuffer();
            //
            // var shaderProgram = createModelShaderProgram(gl);
            // gl.useProgram(shaderProgram);
            // var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            // gl.enableVertexAttribArray(vertexPositionAttribute);
            // var camSpaceMatrixU = gl.getUniformLocation(shaderProgram, 'camSpaceMatrix');
            // gl.uniformMatrix4fv(camSpaceMatrixU, false, camSpaceMatrix);
            // var buf = gl.createBuffer(); // verts for lines in each poly

            // function render(){
            //     gl.clearColor(0, 0, 0, 0);
            //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            //     gl.useProgram(shaderProgram);
            //
            //     var vertices = [];
            //     for (var ent of scene.entities) {
            //         var mdl = ent.model;
            //         var frameverts = mdl.frames[Math.floor($scope.$root.frame)].simpleFrame.verts;
            //         for (var vert of frameverts) {
            //             vertices.push(vert.x, vert.y, vert.z);
            //         }
            //         gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            //         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            //         gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
            //         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
            //         gl.drawElements(gl.LINES, mdl.triangles.length * 3 * 2, gl.UNSIGNED_SHORT, 0);
            //     }
            //
            //     var verts = [];
            //     gl.useProgram(vertShaderProgram);
            //     for (var ent of scene.entities) {
            //         var mdl = ent.model;
            //         for (var vert of mdl.frames[Math.floor($scope.$root.frame)].simpleFrame.verts) {
            //             verts.push(vert.x, vert.y, vert.z);
            //         }
            //         gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
            //         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
            //         gl.vertexAttribPointer(vertShader_aVertPos, 3, gl.FLOAT, false, 0, 0);
            //         gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
            //     }
            //
            //     drawSelectedVerts(gl, svShaderProgram, selectedVertIndexBuf,
            //         svPosAtt, $scope.selectedVerts.length);
            //     drawAxes(gl, axisShaderProgram, axesbuf, axisvertexposatt, axisvertcoloratt);
            //     if ($scope.toolState.get() == 'sweep.sweeping')
            //         drawSweepBox(gl, sweepShaderProgram, sweepBoxVertBuf, swPosAtt);
            //     window.requestAnimationFrame(render);
            // }
            // window.requestAnimationFrame(render);

            // sizeCanvasToContainer(); DONE

            // var vertIndexBuffer = gl.createBuffer();

            // $scope.$watch('model', (newval) => {
            //     if (!newval) return;
            //     scene.entities = [{model: newval}];
            // });
            // $scope.$watchCollection('model.triangles', (tris) => {
            //     var vertIndeces = [];
            //     for (var tri of tris || []) {
            //         vertIndeces.push(tri.vertIndeces[0], tri.vertIndeces[1],
            //             tri.vertIndeces[1], tri.vertIndeces[2],
            //             tri.vertIndeces[2], tri.vertIndeces[0]);
            //     }
            //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
            //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertIndeces), gl.STATIC_DRAW);
            // });
            // $scope.$watchCollection('selectedVerts', (newval) => {
            //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, selectedVertIndexBuf);
            //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newval), gl.STATIC_DRAW);
            // });
        }
    }
};
