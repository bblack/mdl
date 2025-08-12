export default class SweepTool {
  constructor() {
    this.name = 'sweep';
  }

  reset() {
    delete this.state;
    delete this.movingFrom;
    delete this.sweepBoxVerts;
    delete this.orthoWireProjection;
  }

  onMouseDown(evt) {
    if (!evt.orthoWireProjection) return;

    Object.assign(this, {
      state: 'sweeping',
      movingFrom: [evt.offsetX, evt.offsetY],
      sweepBoxVerts: null,
      orthoWireProjection: evt.orthoWireProjection
    });
  }

  onMouseMove(evt) {
    if (this.state == 'sweeping') {
      const { movingFrom } = this;
      const { canvas, getVertsIn, ndcFromCanvasCoords, camSpaceMatrix, buildProjectionMatrix, zoom, scene } = this.orthoWireProjection;
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
