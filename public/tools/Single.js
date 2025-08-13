import OrthoWireProjection from "../OrthoWireProjection";

export default class SingleTool {
  constructor() {
    this.name = 'single';
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
      let { movingFrom } = this;
      let { frame, canvas, buildProjectionMatrix, zoom, scene, moveSelectedVerts, camSpaceMatrix, model } = this.orthoWireProjection;
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
      if (evt.orthoWireProjection) {
        let {
          canvas, scene, camSpaceMatrix, buildProjectionMatrix, zoom, getClosestVert
        } = evt.orthoWireProjection;
        let [w, h] = [canvas.width, canvas.height];
        let [x, y] = [evt.offsetX, evt.offsetY];
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
