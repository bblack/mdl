import { vec3 } from '../components/gl-matrix/lib/gl-matrix.js';
const { sqrt } = Math;

const UNIT_MESH = {
  verts: [
    [1, 0, 0],
    [0.5, 0.5*sqrt(3), 0],
    [-0.5, 0.5*sqrt(3), 0],
    [-1, 0, 0],
    [-0.5, -0.5*sqrt(3), 0],
    [0.5, -0.5*sqrt(3), 0],
  ],
  tris: [
    [0, 1, 5],
    [1, 4, 5],
    [2, 4, 1],
    [2, 3, 4]
  ]
}

export default class AdddiscTool {
  constructor() {
    this.name = 'adddisc';
  }

  reset() {
    delete this.state;
    delete this.canvasStartPos;
    delete this.geomVerts;
    delete this.geomPos;
    delete this.modelVertIndeces;
    delete this.orthoWireProjection;
  }

  onMouseDown(evt) {
    if (!evt.orthoWireProjection) return;

    const [x, y] = [evt.offsetX, evt.offsetY];
    const { canvas, model, worldPosFromCanvasPos, zoom, camSpaceMatrix } = evt.orthoWireProjection;
    const { verts, tris } = UNIT_MESH;
    const newVertIndeces = verts.map(v => model.addVert(v));
    // TODO create Model#addtri
    tris.forEach(tri => {
      tri = tri.map(vertInd => model.vertexCount() + vertInd - verts.length);
      model.triangles.push({ facesFront: 0, vertIndeces: tri });
    });

    console.log('added verts ' + newVertIndeces.join(', '));

    Object.assign(this, {
      state: 'scaling',
      canvasStartPos: [x, y],
      geomVerts: verts, // geometry prototype, e.g. unit disc with origin (0,0,0)
      geomPos: worldPosFromCanvasPos(x, y, canvas, zoom, camSpaceMatrix),
      modelVertIndeces: verts.map((_, i) => model.vertexCount() - verts.length + i),
      orthoWireProjection: evt.orthoWireProjection
    });
  }

  onMouseMove(evt) {
    if (this.state == 'scaling') {
      const { modelVertIndeces, geomVerts, geomPos, canvasStartPos } = this;
      const {
        canvas, model, computeBasisMat3ForNewGeometry, zoom, camSpaceMatrix
      } = this.orthoWireProjection;
      const canvasBounds = canvas.getBoundingClientRect();
      const [x, y] = [evt.clientX - canvasBounds.x, evt.clientY - canvasBounds.y];
      const basis = computeBasisMat3ForNewGeometry(x, y, canvasStartPos, canvas, zoom, camSpaceMatrix);

      const newGeomVertCoords = modelVertIndeces.map((vertIndex, i) => {
        const geomVert = vec3.fromValues.apply(vec3, geomVerts[i]);
        const outVert = vec3.create();

        vec3.transformMat3(outVert, geomVert, basis);
        vec3.add(outVert, outVert, vec3.fromValues.apply(vec3, geomPos));

        return outVert;
      });

      model.frames.forEach(f => {
        modelVertIndeces.forEach((vertIndex, i) => {
          f.simpleFrame.verts[vertIndex] = {
            x: newGeomVertCoords[i][0],
            y: newGeomVertCoords[i][1],
            z: newGeomVertCoords[i][2]
          }
        });
      });
    }
  }

  onMouseUp(evt) {
    if (this.state == 'scaling') {
      const { scene } = this.orthoWireProjection;
      // scene.selectedVerts = this.modelVertIndeces;
      // 1. WHY DOES THE ABOVE MEAN THAT SUBSEQUENT DRAWS REFLECT THE OLD SELECTION FOREVER?
      scene.selectedVerts.splice(0, scene.selectedVerts.length, ...this.modelVertIndeces)
      this.reset();
    }
  }
}
