import OrthoWireProjection from "../OrthoWireProjection";

export default class MoveTool {
  constructor() {
    this.name = 'move';
  }

  reset() {
    delete this.movingFrom;
    delete this.state;
    delete this.orthoWireProjection;
  }

  onMouseDown(evt) {
    if (!evt.orthoWireProjection) return;

    Object.assign(this, {
      movingFrom: [evt.offsetX, evt.offsetY],
      state: 'moving',
      orthoWireProjection: evt.orthoWireProjection
    });
  }

  onMouseMove(evt) {
    if (this.state == 'moving') {
      const { movingFrom } = this;
      const {
        camSpaceMatrix,
        canvas,
        model,
        scene,
        buildProjectionMatrix,
        moveSelectedVerts,
        zoom,
        frame
      } = this.orthoWireProjection;
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
