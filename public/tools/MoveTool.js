export default class MoveTool {
  constructor() {
    this.name = 'move';
  }

  reset() {
    delete this.movingFrom;
    delete this.state;
    delete this.canvas;
    delete this.model;
    delete this.scene;
    delete this.buildProjectionMatrix;
    delete this.moveSelectedVerts;
    delete this.zoom;
    delete this.frame;
    delete this.camSpaceMatrix;
  }

  onMouseDown(evt) {
    if (!evt.canvas) return;

    Object.assign(this, {
      movingFrom: [evt.offsetX, evt.offsetY],
      state: 'moving',
      canvas: evt.canvas,
      model: evt.model,
      scene: evt.scene,
      buildProjectionMatrix: evt.buildProjectionMatrix,
      moveSelectedVerts: evt.moveSelectedVerts,
      zoom: evt.zoom,
      frame: Math.floor(evt.frame),
      camSpaceMatrix: evt.camSpaceMatrix
    });
  }

  onMouseMove(evt) {
    const {
      movingFrom,
      camSpaceMatrix,
      canvas,
      model,
      scene,
      buildProjectionMatrix,
      moveSelectedVerts,
      zoom,
      frame
    } = this;

    if (this.state == 'moving') {
      const canvasBounds = canvas.getBoundingClientRect();
      const [x, y] = [evt.clientX - canvasBounds.x, evt.clientY - canvasBounds.y];
      const [w, h] = [canvas.width, canvas.height];
      const toScr = [x, y];
      const selectedVerts = scene.selectedVerts;
      const projectionMatrix = buildProjectionMatrix(w, h, zoom);

      moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, movingFrom, toScr);
      this.movingFrom = [x, y];
    }
  }

  onMouseUp(evt) {
    if (this.state == 'moving') this.reset();
  }
}
