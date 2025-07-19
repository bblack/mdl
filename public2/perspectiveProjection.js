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
          console.log('linking perspectiveProjection')
          const scene = {};
          const container = $element[0];
          const reactRoot = createRoot(container);
          // ^ apparently you do this ONCE EVER on an element. the second time, you get this error in the console:
          //   > You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.

          const renderReactEl = (scene) => {
            console.log('rendering react element')
            const reactEl = React.createElement(
              PerspectiveProjection, // html el/react el
              { // attrs/params
                mv: $scope.mv,
                scene: scene
              },
              "" // contents/children
            )
            // or, as jsx: (<StrictMode><PerspectiveProjection /></StrictMode>)
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

          // -- old crap --

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

        }
    }
};
