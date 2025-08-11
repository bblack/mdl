export default class SingleTool {
  constructor() {
    this.name = 'single';
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

  onMouseLeave(evt) {
    if (this.state == 'moving') this.reset();
  }

  onMouseMove(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const {
      canvas,
      buildProjectionMatrix,
      getClosestVert,
      zoom,
      scene,
      camSpaceMatrix,
      moveSelectedVerts
    } = evt;
    const [w, h] = [canvas.width, canvas.height];
    const projectionMatrix = buildProjectionMatrix(w, h, zoom);
    const closestVertIndex = getClosestVert(
      x, y, canvas, scene, camSpaceMatrix, projectionMatrix
    );

    const ent = scene.entities[0];

    if (this.state == 'moving') {
      const fromScr = this.movingFrom.slice(); // copy
      const toScr = [x, y];
      const model = ent.model;
      const selectedVerts = scene.selectedVerts;
      const frame = Math.floor(ent.frame);
      moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr);
      this.movingFrom = [x, y];
    } else {
      scene.selectedVerts.splice(0, scene.selectedVerts.length, closestVertIndex);
    }
  }

  onMouseUp(evt) {
    if (this.state == 'moving') this.reset();
  }
}
