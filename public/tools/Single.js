export default class SingleTool {
  constructor() {
    this.name = 'single';
  }

  reset() {
    delete this.movingFrom;
    delete this.state;
    delete this.frame;
    delete this.canvas;
    delete this.buildProjectionMatrix;
    delete this.zoom;
    delete this.scene;
    delete this.camSpaceMatrix;
    delete this.moveSelectedVerts;
    delete this.model;
  }

  onMouseDown(evt) {
    // hacky indictor for "is this event from a OrthoWireProjection component".
    // TODO: make clearer, maybe collect all these in something explicitly named for that component
    if (!evt.canvas) return;

    Object.assign(this, {
      movingFrom: [evt.offsetX, evt.offsetY],
      state: 'moving',
      // --
      frame: Math.floor(evt.frame),
      canvas: evt.canvas,
      buildProjectionMatrix: evt.buildProjectionMatrix,
      zoom: evt.zoom,
      scene: evt.scene,
      camSpaceMatrix: evt.camSpaceMatrix,
      moveSelectedVerts: evt.moveSelectedVerts,
      model: evt.model
    });
  }

  onMouseMove(evt) {
    if (this.state == 'moving') {
      let {
        frame, canvas, movingFrom, buildProjectionMatrix, zoom, scene, moveSelectedVerts, camSpaceMatrix, model
      } = this;
      let fromScr = movingFrom;
      let canvasBounds = canvas.getBoundingClientRect();
      let toScr = [evt.clientX - canvasBounds.x, evt.clientY - canvasBounds.y];
      let [w, h] = [canvas.width, canvas.height];
      let projectionMatrix = buildProjectionMatrix(w, h, zoom);
      let selectedVerts = scene.selectedVerts;

      moveSelectedVerts(
        canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr
      );
      this.movingFrom = toScr;
    } else {
      let {
        canvas, scene, camSpaceMatrix, buildProjectionMatrix, zoom, getClosestVert
      } = evt;

      if (canvas) {
        let [w, h] = [canvas.width, canvas.height];
        let [x, y] = [evt.offsetX, evt.offsetY];
        console.log(`(${[x, y]})`)
        let projectionMatrix = buildProjectionMatrix(w, h, zoom);
        const closestVertIndex = getClosestVert(
          x, y, canvas, scene, camSpaceMatrix, projectionMatrix
        );
        scene.selectedVerts.splice(0, scene.selectedVerts.length, closestVertIndex);
      }
    }
  }

  onMouseUp(evt) {
    if (this.state == 'moving') this.reset();
  }
}
