export default class AddtriTool {
  constructor() {
    this.name = 'addtri';
  }

  reset() {
    delete this.state;
    delete this.newtri;
  }

  onMouseDown(evt) {
    if (!evt.orthoWireProjection) return;

    const newtri = this.newtri;
    const { scene } = evt.orthoWireProjection;

    switch (this.state) {
      case 'vert2':
        newtri.vertIndeces.push(scene.selectedVerts[0]);
        this.state = 'vert3';
        break;
      case 'vert3':
        newtri.vertIndeces.push(scene.selectedVerts[0]);
        scene.entities[0].model.triangles.push(newtri);
        this.newtri = null;
        this.reset();
        break;
      default: // initial state
        this.newtri = {
          facesFront: 0,
          vertIndeces: [scene.selectedVerts[0]]
        };
        this.state = 'vert2';
    }
  }

  onMouseMove(evt) {
    if (!evt.orthoWireProjection) return;

    const [x, y] = [evt.offsetX, evt.offsetY];
    const {
      buildProjectionMatrix, getClosestVert, camSpaceMatrix, canvas, scene, zoom
    } = evt.orthoWireProjection;
    const [w, h] = [canvas.width, canvas.height];
    const projectionMatrix = buildProjectionMatrix(w, h, zoom);
    const closestVertIndex = getClosestVert(
      x, y, canvas, scene, camSpaceMatrix, projectionMatrix
    );

    // replace selected verts with vert nearest to cursor
    scene.selectedVerts.splice(0, scene.selectedVerts.length, closestVertIndex);
  }
}
