import { Vec3 } from '../fv.js';
const { atan2, floor } = Math;

export default class RotateTool {
  constructor() {
    this.name = 'rotate';
  }

  reset() {
    delete this.state;
    delete this.movingFrom;
    delete this.angle;
    delete this.selectedVerts;
    delete this.originalPositions;
  }

  onMouseDown(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const { model, scene } = evt;
    const frame = floor(evt.frame);
    const originalPositions = scene.selectedVerts.map(i => {
      const v = model.frames[frame].simpleFrame.verts[i];
      return new Vec3(v.x, v.y, v.z);
    });

    Object.assign(this, {
      state: 'rotating',
      movingFrom: [x, y],
      angle: 0,
      // probably need axis in world space too
      selectedVerts: scene.selectedVerts,
      originalPositions: originalPositions
    });
  }

  onMouseMove(evt) {
    const [x, y] = [evt.nativeEvent.offsetX, evt.nativeEvent.offsetY];
    const { canvas, model, mv, ndcFromCanvasCoords } = evt;
    const frame = floor(evt.frame);
    const [w, h] = [canvas.width, canvas.height];

    if (this.state == 'rotating') {
      const fromScr = this.movingFrom.slice(); // copy
      const fromNDC = ndcFromCanvasCoords(fromScr, w, h);
      const toScr = [x, y];
      const toNDC = ndcFromCanvasCoords(toScr, w, h);
      const selectedVerts = this.selectedVerts;

      const angle = atan2(toNDC[1], toNDC[0])
        - atan2(fromNDC[1], fromNDC[0]);
      const originalPositions = this.originalPositions;

      const rotateSelectedVerts = function () {
        selectedVerts.forEach((vertIndex, i) => {
          const v = model.frames[frame].simpleFrame.verts[vertIndex];
          // look right down the camera - i.e. z+ axis in cam space - and transform it to world space. (mv is row-major so the indeces are wack)
          const xBasis = new Vec3(mv[0], mv[4], mv[8]);
          const yBasis = new Vec3(mv[1], mv[5], mv[9]);
          const axis = xBasis.cross(yBasis);
          const vr = originalPositions[i].rotate(angle, axis);

          v.x = vr.x;
          v.y = vr.y;
          v.z = vr.z;
        });
      };

      // moveSelectedVerts(canvas, selectedVerts, model, frame, projectionMatrix, camSpaceMatrix, fromScr, toScr);
      rotateSelectedVerts();
      // this.movingFrom = [x, y];
    }
  }

  onMouseUp(evt) {
    if (this.state == 'rotating') this.reset();
  }
};
