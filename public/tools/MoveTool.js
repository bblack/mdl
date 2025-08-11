export default class MoveTool {
  constructor() {
    this.name = 'move';
  }

  reset() {
    delete this.movingFrom;
    delete this.state;
  }

  onMouseDown(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    Object.assign(this, {
      movingFrom: [x, y],
      state: 'moving'
    });
  }

  onMouseMove(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const {
      camSpaceMatrix,
      canvas,
      model,
      scene,
      buildProjectionMatrix,
      moveSelectedVerts,
      zoom
    } = evt;
    const frame = Math.floor(evt.frame);
    const [w, h] = [canvas.width, canvas.height];

    if (this.state == 'moving') {
      const fromScr = this.movingFrom.slice(); // copy
      const toScr = [x, y];
      const selectedVerts = scene.selectedVerts;
      const projectionMatrix = buildProjectionMatrix(w, h, zoom);

      moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr);
      this.movingFrom = [x, y];
    }
  }

  onMouseUp(evt) {
    if (this.state == 'moving') this.reset();
  }
}
