import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { mat4, vec3 } from './components/gl-matrix/lib/gl-matrix.js';
import PerspectiveProjection from './PerspectiveProjection.jsx';

export default function(){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            mv: '='
        },
        template: ``,
        link: function($scope, $element){
          debugger;

          const container = $element[0];
          const reactRoot = createRoot(container);
          // ^ apparently you do this ONCE EVER on an element. the second time, you get this error in the console:
          //   > You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.

          const renderReactEl = (model, frame, palette) => {
            debugger;
            const reactEl = React.createElement(
              PerspectiveProjection, // html el/react el
              { // attrs/params
                mv: $scope.mv,
                model: model,
                frame: frame,
                palette: palette
              },
              "" // contents/children
            )
            // or, as jsx: (<StrictMode><PerspectiveProjection /></StrictMode>)
            reactRoot.render(reactEl);
          }

          $scope.$watch('model',
            // function() {
            //   return {
            //     var model = $scope.model;
            //     var frame = $scope.$root.frame;
            //     var palette = $scope.$root.palette;
            //   };
            // },
            (o) => {
              const model = $scope.model;
              const frame = $scope.$root.frame;
              const palette = $scope.$root.palette;
              debugger;
              if (!model) return;
              // if (!frame) return;
              if (!palette) return;

              renderReactEl(model, frame, palette);
            }
          );

          return;

          // -- old crap --
            var aspect;

            var $canvas = $element.find('canvas');
            var n = 1;
            var f = 100;
            var perspectiveMatrix;
            var scene = {
                entities: []
            };
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
};
