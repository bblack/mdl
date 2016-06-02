function Vec3(x, y, z){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

Vec3.fromArray = function(a){
    return new Vec3(a[0], a[1], a[2]);
}

Vec3.centroid = function(vectors) {
    var sum = new Vec3();
    for (var i=0; i<vectors.length; i++) {
        var v = vectors[i];
        if (!Vec3.prototype.isPrototypeOf(v)) throw 'not a Vec3';
        sum.x += v.x;
        sum.y += v.y;
        sum.z += v.z;
    }
    var centroid = sum.timesScalar(1/vectors.length);
    return centroid;
}

Vec3.prototype.dot = function(b) {
    var a = this;
    if (Vec3.prototype.isPrototypeOf(a))
        a = [a.x, a.y, a.z];
    if (Vec3.prototype.isPrototypeOf(b))
        b = [b.x, b.y, b.z];
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

Vec3.prototype.timesScalar = function(n) {
    var v = this;
    if (Vec3.prototype.isPrototypeOf(v))
        v = [v.x, v.y, v.z];
    return new Vec3(n*v[0], n*v[1], n*v[2]);
}

Vec3.prototype.applyAffineTransform = function(m) {
    var x = this.x, y = this.y, z = this.z;
    // this is a column vector
    return new Vec3(
        x*m[0][0] + y*m[0][1] + z*m[0][2] + m[0][3],
        x*m[1][0] + y*m[1][1] + z*m[1][2] + m[1][3],
        x*m[2][0] + y*m[2][1] + z*m[2][2] + m[2][3]
    );
}

Vec3.prototype.minus = function(v) {
    return new Vec3(
        this.x - v.x,
        this.y - v.y,
        this.z - v.z
    );
}

Vec3.prototype.norm = function(){
    return Math.sqrt(
        Math.pow(this.x, 2) +
        Math.pow(this.y, 2) +
        Math.pow(this.z, 2));
}

Vec3.prototype.distance = function(v) {
    return Math.abs(this.minus(v).norm());
}

Vec3.prototype.normalized = function(){
    var norm = this.norm();
    return this.timesScalar(1 / norm);
}

Vec3.prototype.cross = function(v){
    return new Vec3(
        this.y*v.z - this.z*v.y,
        this.z*v.x - this.x*v.z,
        this.x*v.y - this.y*v.x
    );
};
