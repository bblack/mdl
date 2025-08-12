export default class AddvertTool {
  constructor() {
    this.name = 'addvert';
  }

  onMouseDown(evt) {
    // hacky indictor for "is this event from a OrthoWireProjection component".
    // TODO: make clearer, maybe collect all these in something explicitly named for that component
    if (!evt.canvas) return;

    const [x, y] = [evt.offsetX, evt.offsetY];
    const { canvas, worldPosFromCanvasPos, zoom, camSpaceMatrix, model } = evt;
    const vWorld = worldPosFromCanvasPos(x, y, canvas, zoom, camSpaceMatrix);
    model.addVert(vWorld[0], vWorld[1], vWorld[2]);
  }
}
