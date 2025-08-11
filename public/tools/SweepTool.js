export default class SweepTool {
  constructor() {
    this.name = 'sweep';
  }


  reset() {
    delete this.state;
    delete this.movingFrom;
    delete this.sweepBoxVerts;
    delete this.componentRef;
  }

  onMouseDown(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    Object.assign(this, {
      state: 'sweeping',
      movingFrom: [x, y],
      sweepBoxVerts: null,
      componentRef: evt.componentRef
    });
  }

  onMouseMove(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const {canvas} = evt;
    const [w, h] = [canvas.width, canvas.height];

    if (this.state == 'sweeping') {
      const movingFrom = this.movingFrom;
      const {
        camSpaceMatrix,
        projectionMatrix,
        scene,
        // TODO: move these functions up, and instead pass only data
        getVertsIn,
        ndcFromCanvasCoords
      } = evt;
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
