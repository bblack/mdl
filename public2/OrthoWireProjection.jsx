import { mat4, vec3, vec4 } from './components/gl-matrix/lib/gl-matrix.js';
import { useEffect, useRef, useState } from 'react';

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
function createVertShaderProgram(gl){
    var vertshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertshader, `
        attribute vec3 aVertPos;
        uniform mat4 projMatrix;
        uniform mat4 camSpaceMatrix;
        void main(void){
            gl_Position = projMatrix * camSpaceMatrix * vec4(aVertPos, 1.0);
            gl_PointSize = 4.0;
        }
    `);
    gl.compileShader(vertshader);
    if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(vertshader));
    var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragshader, `
        void main(void){
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `);
    gl.compileShader(fragshader);
    if (!gl.getShaderParameter(fragshader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(fragshader));
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
function createSweepShaderProgram(gl){
    var vertshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertshader, `
        attribute vec3 aVertPos;
        void main(void){
            gl_Position = vec4(aVertPos, 1.0);
        }
    `);
    gl.compileShader(vertshader);
    if (!gl.getShaderParameter(vertshader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vertshader));
    }
    var fragshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragshader, `
        void main(void){
            gl_FragColor = vec4(1.0, 0.0, 0.0, 0.1);
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
function drawSelectedVerts(gl, shaderProgram, buf, vertPosAtt, selectedVerts){
    const numPoints = selectedVerts.length;
    gl.useProgram(shaderProgram);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(selectedVerts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertPosAtt, 3, gl.FLOAT, false, 0, 0);
    gl.drawElements(gl.POINTS, numPoints, gl.UNSIGNED_SHORT, 0);
}
function drawSweepBox(gl, sweepShaderProgram, sweepBoxVertBuf, swPosAtt, sweepBoxVerts){
    if (!sweepBoxVerts || sweepBoxVerts.length == 0) return;

    gl.useProgram(sweepShaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, sweepBoxVertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sweepBoxVerts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(swPosAtt, 3, gl.FLOAT, false, 0, 0);

    // i don't know why, but even though the box appears, this regularly causes "GL_INVALID_OPERATION: glDrawArrays: Vertex buffer is not big enough for the draw call."
    // the box is laggy wrt user input. is every other draw failing for some reason?
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function sizeCanvasToContainer(canvas, gl, zoom, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram) {
  const container = canvas.parentElement;
  const w = container.clientWidth;
  const h = container.clientHeight;

  canvas.setAttribute('width', w);
  canvas.setAttribute('height', h);

  // below here should probably be in some event listener instead
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const projectionMatrix = buildProjectionMatrix(w, h, zoom);
  setProjectionMatrixUniforms(projectionMatrix, gl, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram);
}

function setProjectionMatrixUniforms(projectionMatrix, gl, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram) {
  gl.useProgram(vertShaderProgram);
  const vertProjMatrixU = gl.getUniformLocation(vertShaderProgram, 'projMatrix');
  gl.uniformMatrix4fv(vertProjMatrixU, false, new Float32Array(projectionMatrix));

  gl.useProgram(svShaderProgram);
  const svProjMatrixU = gl.getUniformLocation(svShaderProgram, 'projMatrix');
  gl.uniformMatrix4fv(svProjMatrixU, false, new Float32Array(projectionMatrix));

  gl.useProgram(axisShaderProgram);
  const axisMatrixUniform = gl.getUniformLocation(axisShaderProgram, 'matrix');
  gl.uniformMatrix4fv(axisMatrixUniform, false, new Float32Array(projectionMatrix));

  gl.useProgram(shaderProgram);
  const matrixUniform = gl.getUniformLocation(shaderProgram, 'matrix');
  gl.uniformMatrix4fv(matrixUniform, false, new Float32Array(projectionMatrix));
}

function ndcToWorld(vNDC, projectionMatrix, camSpaceMatrix){
    var invProjMat = mat4.create();
    mat4.invert(invProjMat, projectionMatrix);
    var vCam = vec4.create();
    vec4.transformMat4(vCam, vNDC, invProjMat);
    var invCamSpaceMat = mat4.create();
    mat4.invert(invCamSpaceMat, camSpaceMatrix);
    var vWorld = vec4.create();
    vec4.transformMat4(vWorld, vCam, invCamSpaceMat);
    return vWorld;
}

function buildProjectionMatrix(w, h, zoom) {
  const aspect = w/h;
  const n = -100;
  const f = 100;

  return [
      zoom/aspect, 0, 0, 0,
      0, zoom, 0, 0,
      0, 0, -2/(f-n), 0,
      0, 0, -(f+n)/(f-n), 1.0
  ];
}

function getClosestVert(x, y, canvas, scene, camSpaceMatrix, projectionMatrix) {
    var cursorNDC = [
        x / canvas.clientWidth * 2 - 1,
        -(y / canvas.clientHeight * 2 - 1)
    ];
    var closestVertDist = Infinity;
    var closestVertIndex;
    for (var ent of scene.entities) {
        const frame = ent.frame;
        var verts = ent.model.frames[Math.floor(frame)].simpleFrame.verts;
        for (var i=0; i<verts.length; i++) {
            var vert = verts[i];
            var vertNDC = worldToNDC(vert, camSpaceMatrix, projectionMatrix);
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

function moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr) {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var fromNDC = [fromScr[0]/w*2-1, fromScr[1]/h*-2+1, 0, 1];
    var toNDC = [toScr[0]/w*2-1, toScr[1]/h*-2+1, 0, 1];
    var fromObj = ndcToWorld(fromNDC, projectionMatrix, camSpaceMatrix);
    var toObj = ndcToWorld(toNDC, projectionMatrix, camSpaceMatrix);
    var delta = vec4.create();
    vec4.subtract(delta, toObj, fromObj);

    selectedVerts.forEach((vertIndex) => {
        // var vert = $scope.model.frames[Math.floor($scope.$root.frame)].simpleFrame.verts[vertIndex];
        var vert = model.frames[frame].simpleFrame.verts[vertIndex];
        vert.x += delta[0];
        vert.y += delta[1];
        vert.z += delta[2];
    });
}

function getVertsIn(x1, y1, x2, y2, w, h, camSpaceMatrix, projectionMatrix, scene) {
    var x1ndc = x1 / w * 2 - 1;
    var y1ndc = y1 / h * -2 + 1;
    var x2ndc = x2 / w * 2 - 1;
    var y2ndc = y2 / h * -2 + 1;
    var xlondc = Math.min(x1ndc, x2ndc);
    var xhindc = Math.max(x1ndc, x2ndc);
    var ylondc = Math.min(y1ndc, y2ndc);
    var yhindc = Math.max(y1ndc, y2ndc);
    var vertsHitIndeces = [];
    for (var ent of scene.entities) {
        var verts = ent.model.frames[Math.floor(ent.frame)].simpleFrame.verts;
        for (var i=0; i<verts.length; i++) {
            var vertNDC = worldToNDC(verts[i], camSpaceMatrix, projectionMatrix);

            if (vertNDC[0] > xlondc && vertNDC[0] < xhindc
                && vertNDC[1] > ylondc && vertNDC[1] < yhindc) {
                vertsHitIndeces.push(i);
            }
        }
    }

    return vertsHitIndeces;
}

function worldToNDC(vert, camSpaceMatrix, projectionMatrix) {
    var vertNDC = [vert.x, vert.y, vert.z, 1];
    vec4.transformMat4(vertNDC, vertNDC, camSpaceMatrix);
    vec4.transformMat4(vertNDC, vertNDC, projectionMatrix);
    return [
        vertNDC[0] / vertNDC[3],
        vertNDC[1] / vertNDC[3],
        vertNDC[2] / vertNDC[3]
    ];
}

// TODO: scene ref was given to this component by parent. instead of manipulating scene contents directly, like scene.selectedVerts, we should emit event and allow something up top to set it. but for now, we edit them in place.
export default function OrthoWireProjection({mv, scene, toolState}) {
  console.log('OrthoWireProjection entered');

  const canvasRef = useRef(null);
  const camSpaceMatrix = mv;
  var zoom = 1/40;

  var gl;
  var vertShaderProgram;
  var svShaderProgram;
  var axisShaderProgram;
  var shaderProgram;
  var sweepShaderProgram;
  var sweepBoxVertBuf;

  var movingFrom;
  var newtri;
  var sweepBoxVerts;

  useEffect(() => {
      console.log('OrthoWireProjection: useEffect entered');
      const canvas = canvasRef.current;
      gl = canvas.getContext('webgl');

      // create shader programs

      sweepShaderProgram = createSweepShaderProgram(gl);
      gl.useProgram(sweepShaderProgram);
      var swPosAtt = gl.getAttribLocation(sweepShaderProgram, 'aVertPos');
      gl.enableVertexAttribArray(swPosAtt);

      svShaderProgram = createSelectedVertShaderProgram(gl);
      gl.useProgram(svShaderProgram);
      var svPosAtt = gl.getAttribLocation(svShaderProgram, 'aVertPos');
      gl.enableVertexAttribArray(svPosAtt);
      var svCamSpaceMatrixU = gl.getUniformLocation(svShaderProgram, 'camSpaceMatrix');
      gl.uniformMatrix4fv(svCamSpaceMatrixU,  false, new Float32Array(camSpaceMatrix));

      var axesbuf = bufferAxes(gl);
      axisShaderProgram = createAxisShaderProgram(gl);
      gl.useProgram(axisShaderProgram);
      var axisvertexposatt = gl.getAttribLocation(axisShaderProgram, 'aVertexPos');
      gl.enableVertexAttribArray(axisvertexposatt);
      var axisvertcoloratt = gl.getAttribLocation(axisShaderProgram, 'aVertexColor');
      gl.enableVertexAttribArray(axisvertcoloratt);
      var axisCamMatrixU = gl.getUniformLocation(axisShaderProgram, 'camSpaceMatrix');
      gl.uniformMatrix4fv(axisCamMatrixU, false, new Float32Array(camSpaceMatrix));

      vertShaderProgram = createVertShaderProgram(gl);
      gl.useProgram(vertShaderProgram);
      var vertShader_aVertPos = gl.getAttribLocation(vertShaderProgram, 'aVertPos');
      gl.enableVertexAttribArray(vertShader_aVertPos);
      var vertCamSpaceMatrixU = gl.getUniformLocation(vertShaderProgram, 'camSpaceMatrix');
      gl.uniformMatrix4fv(vertCamSpaceMatrixU, false, camSpaceMatrix);
      var vertBuf = gl.createBuffer();

      shaderProgram = createModelShaderProgram(gl);
      gl.useProgram(shaderProgram);
      var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
      var camSpaceMatrixU = gl.getUniformLocation(shaderProgram, 'camSpaceMatrix');
      gl.uniformMatrix4fv(camSpaceMatrixU, false, camSpaceMatrix);

      var buf = gl.createBuffer(); // verts for lines in each poly
      var vertIndexBuffer = gl.createBuffer();
      var selectedVertIndexBuf = gl.createBuffer();
      sweepBoxVertBuf = gl.createBuffer();

      sizeCanvasToContainer(canvas, gl, zoom, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram);

      window.addEventListener('resize', () => {
        sizeCanvasToContainer(canvas, gl, zoom, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram);
      });

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      function render(){
          const selectedVerts = scene.selectedVerts;

          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.useProgram(shaderProgram);

          var vertices = [];
          for (var ent of scene.entities) {
              var mdl = ent.model;
              const frame = ent.frame;
              var frameverts = mdl.frames[Math.floor(frame)].simpleFrame.verts;
              for (var vert of frameverts) {
                  vertices.push(vert.x, vert.y, vert.z);
              }

              // triangles, i think:
              var vertIndeces = [];
              for (var tri of mdl.triangles || []) {
                  vertIndeces.push(tri.vertIndeces[0], tri.vertIndeces[1],
                      tri.vertIndeces[1], tri.vertIndeces[2],
                      tri.vertIndeces[2], tri.vertIndeces[0]);
              }

              // fill this buffer w/ vertices, and bind it to an attribuet:
              gl.bindBuffer(gl.ARRAY_BUFFER, buf);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
              gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

              // then fill another buffer w/ triangles, and draw them:
              gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
              gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertIndeces), gl.STATIC_DRAW);
              gl.drawElements(gl.LINES, mdl.triangles.length * 3 * 2, gl.UNSIGNED_SHORT, 0);
          }

          var verts = [];
          gl.useProgram(vertShaderProgram);
          for (var ent of scene.entities) {
              var mdl = ent.model;
              const frame = ent.frame;
              for (var vert of mdl.frames[Math.floor(frame)].simpleFrame.verts) {
                  verts.push(vert.x, vert.y, vert.z);
              }
              gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
              gl.vertexAttribPointer(vertShader_aVertPos, 3, gl.FLOAT, false, 0, 0);
              gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
          }

          drawSelectedVerts(gl, svShaderProgram, selectedVertIndexBuf,
              svPosAtt, selectedVerts);
          drawAxes(gl, axisShaderProgram, axesbuf, axisvertexposatt, axisvertcoloratt);

          if (toolState.get() == 'sweep.sweeping') {
            drawSweepBox(gl, sweepShaderProgram, sweepBoxVertBuf, swPosAtt, sweepBoxVerts);
          }

          window.requestAnimationFrame(render);
      }

      render();

  }, [true]); // dependency on constant "true" so useEffect runs only on first render

  function onMouseDown(evt) {
    const canvas = canvasRef.current;
    const _toolState = toolState.get();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const w = canvas.width;
    const h = canvas.height;

    switch (_toolState) {
      case 'addtri':
        newtri = {
          facesFront: 0,
          vertIndeces: [scene.selectedVerts[0]]
        };
        toolState.set('addtri.vert2');
        break;
      case 'addtri.vert2':
        newtri.vertIndeces.push(scene.selectedVerts[0]);
        toolState.set('addtri.vert3');
        break;
      case 'addtri.vert3':
        newtri.vertIndeces.push(scene.selectedVerts[0]);
        scene.entities[0].model.triangles.push(newtri);
        newtri = null;
        toolState.set('addtri');
        break;
      case 'addvert':
        var xNDC = x / canvas.clientWidth * 2 - 1;
        var yNDC = y / canvas.clientHeight * -2 + 1;
        var vNDC = vec4.fromValues(xNDC, yNDC, 0, 1);
        const projectionMatrix = buildProjectionMatrix(w, h, zoom);
        var vWorld = ndcToWorld(vNDC, projectionMatrix, camSpaceMatrix);
        scene.entities[0].model.addVert(vWorld[0], vWorld[1], vWorld[2]);
        break;
      case 'move':
        movingFrom = [x, y];
        toolState.set('move.moving');
        break;
      case 'single':
        movingFrom = [x, y];
        toolState.set('single.moving');
        break;
      case 'sweep':
        movingFrom = [x, y];
        sweepBoxVerts = null;
        toolState.set('sweep.sweeping');
        break;
      default:
        // console.warn(`onMouseDown when toolState=${_toolState} is not yet implemented`);
    }
  }

  function onMouseUp(evt) {
    const canvas = canvasRef.current;
    const _toolState = toolState.get();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const w = canvas.width;
    const h = canvas.height;

    switch (_toolState) {
      case 'move.moving':
        movingFrom = null;
        toolState.set('move');
      case 'single.moving':
        movingFrom = null;
        toolState.set('single');
        break;
      case 'sweep.sweeping':
        movingFrom = null;
        toolState.set('sweep');
        break;
      default:
        // console.warn(`onMouseUp when toolState=${_toolState} is not yet implemented`);
    }
  }

  function onMouseLeave(evt) {
    const canvas = canvasRef.current;
    const _toolState = toolState.get();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const w = canvas.width;
    const h = canvas.height;

    switch (_toolState) {
      case 'single.moving':
        movingFrom = null;
        toolState.set('single');
        break;
      default:
        // console.warn(`onMouseLeave when toolState=${_toolState} is not yet implemented`);
    }
  }

  function onMouseMove(evt) {
    const canvas = canvasRef.current;
    const _toolState = toolState.get();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const w = canvas.width;
    const h = canvas.height;
    var projectionMatrix = null;
    var closestVertIndex = null;
    var selectedVerts = null;

    switch (_toolState) {
      case 'addtri':
      case 'addtri.vert2':
      case 'addtri.vert3':
        projectionMatrix = buildProjectionMatrix(w, h, zoom);
        closestVertIndex = getClosestVert(x, y, canvas, scene, camSpaceMatrix, projectionMatrix);
        scene.selectedVerts.splice(0, scene.selectedVerts.length, closestVertIndex);
        break;
      case 'single':
        projectionMatrix = buildProjectionMatrix(w, h, zoom);
        closestVertIndex = getClosestVert(x, y, canvas, scene, camSpaceMatrix, projectionMatrix);
        scene.selectedVerts.splice(0, scene.selectedVerts.length, closestVertIndex);
        break;
      case 'single.moving':
      case 'move.moving':
        const fromScr = movingFrom;
        const toScr = [x, y];
        const model = scene.entities[0].model;
        selectedVerts = scene.selectedVerts;
        const frame = Math.floor(scene.entities[0].frame);
        projectionMatrix = buildProjectionMatrix(w, h, zoom);
        moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr);
        movingFrom = [x, y];
        break;
      case 'sweep.sweeping':
        projectionMatrix = buildProjectionMatrix(w, h, zoom);
        selectedVerts = getVertsIn(movingFrom[0], movingFrom[1], x, y,
          w, h, camSpaceMatrix, projectionMatrix, scene);

        scene.selectedVerts.splice(0, scene.selectedVerts.length, ...selectedVerts);

        console.log(`between (${movingFrom[0]}, ${movingFrom[1]}) and (${x}, ${y}), selected ${scene.selectedVerts.length} verts`)

        var fromNDC = [
            movingFrom[0] / w * 2 - 1,
            movingFrom[1] / h * -2 + 1
        ];
        var toNDC = [
            x / w * 2 - 1,
            y / h * -2 + 1
        ];

        sweepBoxVerts = new Float32Array([
            fromNDC[0], fromNDC[1], 0, // x, y, z NDC
            fromNDC[0], toNDC[1], 0,
            toNDC[0], toNDC[1], 0,
            toNDC[0], fromNDC[1], 0
        ]);
      default:
        // console.warn(`onMouseMove when toolState=${_toolState} is not yet implemented`);
    }
  }

  function onWheel(evt) {
    const canvas = canvasRef.current;

    zoom *= Math.pow(1.1, -evt.nativeEvent.deltaY / 10);
    // this is overkill. all we want is to compute and set the projection matrix, and let that get put in the relevant uniforms in the shader programs. but that's inlined in this fn for now, so:
    sizeCanvasToContainer(canvas, gl, zoom, vertShaderProgram, svShaderProgram, axisShaderProgram, shaderProgram);
  }

  return (
    <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
    ></canvas>
  )
}
