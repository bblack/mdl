import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
        }
    }
};
