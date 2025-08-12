export default class SweepTool {
  constructor() {
    this.name = 'sweep';
  }

  reset() {
    delete this.state;
    delete this.movingFrom;
    delete this.sweepBoxVerts;
    delete this.componentRef;
    delete this.getVertsIn;
    delete this.ndcFromCanvasCoords;
    delete this.canvas;
    delete this.scene;
    delete this.camSpaceMatrix;
    delete this.buildProjectionMatrix;
    delete this.zoom;
  }

  onMouseDown(evt) {
    // hacky indictor for "is this event from a OrthoWireProjection component".
    // TODO: make clearer, maybe collect all these in something explicitly named for that component
    if (!evt.canvas) return;

    Object.assign(this, {
      state: 'sweeping',
      movingFrom: [evt.offsetX, evt.offsetY],
      sweepBoxVerts: null,
      componentRef: evt.componentRef,
      // TODO: move these functions up, and instead pass only data
      // actually what we should probably do is take just a handle to the "active" ortho pane, and call methods of it when we need them, e.g. later on mouse moves, to get stuff like projection matrix and zoom.
      getVertsIn: evt.getVertsIn,
      ndcFromCanvasCoords: evt.ndcFromCanvasCoords,
      canvas: evt.canvas,
      scene: evt.scene,
      camSpaceMatrix: evt.camSpaceMatrix,
      buildProjectionMatrix: evt.buildProjectionMatrix,
      zoom: evt.zoom
    });
  }

  onMouseMove(evt) {
    if (this.state == 'sweeping') {
      const {canvas, getVertsIn, ndcFromCanvasCoords, movingFrom, camSpaceMatrix, buildProjectionMatrix, zoom, scene} = this;
      const canvasBounds = canvas.getBoundingClientRect();
      const [x, y] = [
        evt.clientX - canvasBounds.x,
        evt.clientY - canvasBounds.y
      ];
      const [w, h] = [canvas.width, canvas.height];
      const projectionMatrix = buildProjectionMatrix(w, h, zoom);
      const selectedVerts = getVertsIn(movingFrom[0], movingFrom[1], x, y,
        w, h, camSpaceMatrix, projectionMatrix, scene);

      scene.selectedVerts.splice(0, scene.selectedVerts.length, ...selectedVerts);

      var fromNDC = ndcFromCanvasCoords(movingFrom, w, h);
      var toNDC = ndcFromCanvasCoords([x, y], w, h);

      this.sweepBoxVerts = new Float32Array([
        fromNDC[0], fromNDC[1], 0, // x, y, z NDC
        fromNDC[0], toNDC[1], 0,
        toNDC[0], toNDC[1], 0,
        toNDC[0], fromNDC[1], 0
      ]);
    }
  }

  onMouseUp(evt) {
    if (this.state == 'sweeping') this.reset();
  }
}
