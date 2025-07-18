// /* MDL header */
// struct mdl_header_t
// {
//   int ident;            /* magic number: "IDPO" */
//   int version;          /* version: 6 */
//
//   vec3_t scale;         /* scale factor */
//   vec3_t translate;     /* translation vector */
//   float boundingradius;
//   vec3_t eyeposition;   /* eyes' position */
//
//   int num_skins;        /* number of textures */
//   int skinwidth;        /* texture width */
//   int skinheight;       /* texture height */
//
//   int num_verts;        /* number of vertices */
//   int num_tris;         /* number of triangles */
//   int num_frames;       /* number of frames */
//
//   int synctype;         /* 0 = synchron, 1 = random */
//   int flags;            /* state flag */
//   float size;
// };
function Typedef(existingType, count) {
  this.existingType = existingType;
  this.count = count;
}

Typedef.prototype.from = function(b) {
  var o = [];
  const dv = new DataView(b);
  for (var i=0; i < this.count; i++) {
    o.push(
      this.existingType == 'float' ? dv.getFloat32(i*4) :
      Struct.isPrototypeOf(this.existingType) ? existingType.from(new DataView(b, i*existingType.sizeof()))
    );
  }
  return o.length > 1 ? o : o[0];
}

function typedef(existingType, count) {
  if (count === undefined) count = 1;
  return new Typedef(existingType, count);
}

const vec3_t = typedef('float', 3);
// const mdl_header_t = typedef(
//   struct()
//     .field('int', 'ident')
//     .field('int', 'version')
//     .field(vec3_t, 'scale')
// );

const b = new ArrayBuffer(20);
const dv = new DataView(b);
dv.setInt32(0, 1);
dv.setInt32(4, 2);
dv.setFloat32(8, 0.123);
dv.setFloat32(12, 0.456);
dv.setFloat32(16, 0.789);

const vec3_t_instance = vec3_t.from(b);
console.log(vec3_t_instance);
