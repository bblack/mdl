export default class AddvertTool {
  constructor() {
    this.name = 'addvert';
  }

  onMouseDown(evt) {
    if (!evt.orthoWireProjection) return;

    const [x, y] = [evt.offsetX, evt.offsetY];
    const { canvas, worldPosFromCanvasPos, zoom, camSpaceMatrix, model } = evt.orthoWireProjection;
    const vWorld = worldPosFromCanvasPos(x, y, canvas, zoom, camSpaceMatrix);
    model.addVert(vWorld[0], vWorld[1], vWorld[2]);
  }
}
