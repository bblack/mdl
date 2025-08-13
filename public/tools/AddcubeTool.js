import AbstractAddGeomTool from "./AbstractAddGeomTool.js";

export default class AddcubeTool extends AbstractAddGeomTool {
  constructor() {
    super();
    this.name = 'addcube';
    this.UNIT_MESH = {
      verts: [
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 1],
        [0, 1, 1],
        [1, 1, 1],
        [1, 0, 1],
      ],
      tris: [
        [2, 1, 0],
        [0, 3, 2],
        [5, 6, 7],
        [7, 4, 5],
        [1, 5, 4],
        [4, 0, 1],
        [6, 2, 3],
        [3, 7, 6],
        [3, 0, 4],
        [4, 7, 3],
        [6, 5, 1],
        [1, 2, 6]
      ]
    };
  }
}
