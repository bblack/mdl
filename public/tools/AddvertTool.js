export default class AddvertTool {
  constructor() {
    this.name = 'addvert';
  }

  onMouseDown(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const { canvas, worldPosFromCanvasPos, zoom, camSpaceMatrix, model } = evt;
    const vWorld = worldPosFromCanvasPos(x, y, canvas, zoom, camSpaceMatrix);
    model.addVert(vWorld[0], vWorld[1], vWorld[2]);
  }
}
