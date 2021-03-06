namespace Aurora {
    export class Quaternion {
        public static readonly CONST_IDENTITY: Quaternion = new Quaternion();

        public x: number;
        public y: number;
        public z: number;
        public w: number;

        constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

        public get length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        public get lengthSq(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        }

        public setFromNumbers(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quaternion {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        public setFromArray(numbers: number[], offset: uint = 0): Quaternion {
            this.x = numbers[offset];
            this.y = numbers[offset + 1];
            this.z = numbers[offset + 2];
            this.w = numbers[offset + 3];

            return this;
        }

        public set(q: Quaternion): Quaternion {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;

            return this;
        }

        public conjugate(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromNumbers(-this.x, -this.y, -this.z, this.w) : new Quaternion(-this.x, -this.y, -this.z, this.w);
        }

        /**
         * need is a unit quaternion.
         */
        public invert(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromNumbers(-this.x, -this.y, -this.z, this.w) : new Quaternion(-this.x, -this.y, -this.z, this.w);
            //const f = 1 / this.length;
            //return rst ? rst.setFromNumbers(-this.x * f, -this.y * f, -this.z * f, this.w * f) : new Quaternion(-this.x * f, -this.y * f, -this.z * f, this.w * f);
        }

        /**
         * @param rst values are radians.
         */
        public toEuler(rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            const y2 = this.y * this.y;
            rst.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), (1 - 2 * (this.x * this.x + y2)));
            rst.y = Math.asin(2 * (this.w * this.y - this.z * this.x));
            rst.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), (1 - 2 * (y2 + this.z * this.z)));

            return rst;
        }

        public normalize(): Quaternion {
            const len = this.length;
            this.x /= len;
            this.y /= len;
            this.z /= len;
            this.w /= len;

            return this;
        }

        public static createFromEulerX(radian: number, rst: Quaternion = null): Quaternion {
            radian *= 0.5;
            const x = Math.sin(radian);
            const w = Math.cos(radian);

            return rst ? rst.setFromNumbers(x, 0, 0, w) : new Quaternion(x, 0, 0, w);
        }

        public static createFromEulerY(radian: number, rst: Quaternion = null): Quaternion {
            radian *= 0.5;
            const y = Math.sin(radian);
            const w = Math.cos(radian);

            return rst ? rst.setFromNumbers(0, y, 0, w) : new Quaternion(0, y, 0, w);
        }

        public static createFromEulerZ(radian: number, rst: Quaternion = null): Quaternion {
            radian *= 0.5;
            const z = Math.sin(radian);
            const w = Math.cos(radian);

            return rst ? rst.setFromNumbers(0, 0, z, w) : new Quaternion(0, 0, z, w);
        }

        public static createFromEulerXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Quaternion = null): Quaternion {
            x *= 0.5;
            y *= 0.5;
            z *= 0.5;

            const sinX = Math.sin(x);
            const cosX = Math.cos(x);
            const sinY = Math.sin(y);
            const cosY = Math.cos(y);
            const sinZ = Math.sin(z);
            const cosZ = Math.cos(z);

            const scXY = sinX * cosY;
            const csXY = cosX * sinY;
            const ccXY = cosX * cosY;
            const ssXY = sinX * sinY;

            x = scXY * cosZ - csXY * sinZ;
            y = csXY * cosZ + scXY * sinZ;
            z = ccXY * sinZ - ssXY * cosZ;
            const w = ccXY * cosZ + ssXY * sinZ;

            return rst ? rst.setFromNumbers(x, y, z, w) : new Quaternion(x, y, z, w);
        }

        public static createFromEulerVector3(angles: Vector3, rst: Quaternion = null): Quaternion {
            return Quaternion.createFromEulerXYZ(angles.x, angles.y, angles.z, rst);
        }

        /**
         *
         * @param forward  at - eye, normalized.
         */
        public static createLookAt(forward: Vector3, upward: Vector3, rst: Quaternion = null): Quaternion {
            const zaxis = forward;
            const xaxis = Vector3.cross(upward, zaxis).normalize();
            const yaxis = Vector3.cross(zaxis, xaxis);

            const w = Math.sqrt(1 + xaxis.x + yaxis.y + zaxis.z) * 0.5;
            const recip = 0.25 / w;
            const x = (yaxis.z - zaxis.y) * recip;
            const y = (zaxis.x - xaxis.z) * recip;
            const z = (xaxis.y - yaxis.x) * recip;

            return rst ? rst.setFromNumbers(x, y, z, w) : new Quaternion(x, y, z, w);
        }
    
        /**
		 * @param axis the axis is a normalize vector.
		 */
        public static createFromAxis(axis: Vector3, radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;
            const s = Math.sin(radian);

            return rst.setFromNumbers(-axis.x * s, -axis.y * s, -axis.z * s, Math.cos(radian));
        }

        /**
         * @param t [0.0 - 1.0]
         */
        public static slerp(from: Quaternion, to: Quaternion, t: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            let x = to.x, y = to.y, z = to.z, w = to.w;
            let cos = from.x * x + from.y * y + from.z * z + from.w * w;
            if (cos < 0) {//shortest path
                x = -x;
                y = -y;
                z = -z;
                w = -w;
                cos = -cos;
            }
            let k0: number, k1: number;
            if (cos > 0.9999) {
                k0 = 1 - t;
                k1 = t;
            } else {
                const a = Math.acos(cos);
                const s = Math.sin(a);
                const ta = t * a;
                k0 = Math.sin(a - ta) / s;
                k1 = Math.sin(ta) / s;
            }

            rst.x = from.x * k0 + x * k1;
            rst.y = from.y * k0 + y * k1;
            rst.z = from.z * k0 + z * k1;
            rst.w = from.w * k0 + w * k1;

            return rst;
        }

        public static dot(q0: Quaternion, q1: Quaternion): number {
            return q0.x * q1.x + q0.y * q1.y + q0.z * q1.z + q0.w * q1.w;
        }

        public static angleBetween(q0: Quaternion, q1: Quaternion): number {
            return Math.acos(q0.x * q1.x + q0.y * q1.y + q0.z * q1.z + q0.w * q1.w);
        }

        public get isIdentity(): boolean {
            return this.x === 0 && this.y === 0 && this.z === 0 && this.w === 1;
        }

        public get angle(): number {
            return Math.acos(this.w);
        }

        public identity(): void {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        }

        public mulNumber(s: number, rst: Quaternion = null): Quaternion {
            rst = rst || this;

            rst.x *= s;
            rst.y *= s;
            rst.z *= s;
            rst.w *= s;

            return rst;
        }

        public log(rst: Quaternion = null): Quaternion {
            rst = rst || this;

            const len2 = this.x * this.x + this.y * this.y + this.z * this.z;
            if (len2 <= MathUtils.EPSILON_SQ) {
                return rst.setFromNumbers(this.x, this.y, this.z, Math.log(this.w));
            } else {
                const len = Math.sqrt(len2);
                const f = Math.atan2(len, this.w) / len;
                return rst.setFromNumbers(f * this.x, f * this.y, f * this.z, Math.log(this.w * this.w + len2) * 0.5);
            }
        }

        public exp(rst: Quaternion = null): Quaternion {
            rst = rst || this;

            let len = this.x * this.x + this.y * this.y + this.z * this.z;
            if (len <= MathUtils.EPSILON_SQ) {
                return rst.setFromNumbers(this.x, this.y, this.z, Math.exp(this.w));
            } else {
                len = Math.sqrt(len);
                const e = Math.exp(this.w);
                const f = e * Math.sin(len) / len;
                return rst.setFromNumbers(f * this.x, f * this.y, f * this.z, e * Math.cos(len));
            }
        }

        public pow(exp: number, rst: Quaternion = null): Quaternion {
            rst = rst || this;

            if (this.w >= 1) {
                return rst.setFromNumbers(0, 0, 0, 1);
            } else {
                const t = Math.acos(this.w);
                const te = t * exp;
                const f = Math.sin(te) / Math.sin(t);
                return rst.setFromNumbers(f * this.x, f * this.y, f * this.z, Math.cos(te));
            }
        }

        public isEqual(toCompare: Quaternion, tolerance: number = 0): boolean {
            if (tolerance === 0) {
                return this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z && this.w === toCompare.w;
            } else {
                if (tolerance < 0) tolerance = -tolerance;
                tolerance *= tolerance;
                const x = this.x - toCompare.x;
                const y = this.y - toCompare.y;
                const z = this.z - toCompare.z;
                const w = this.w - toCompare.w;

                return (x * x + y * y + z * z + w * w) <= tolerance;
            }
        }

        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        /*
        public append(q: Quaternion, rst: Quaternion = null): Quaternion {
            const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
            const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
            const y = this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z;
            const z = this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x;

            return rst ? rst.setFromNumbers(x, y, z, w) : new Quaternion(x, y, z, w);
        }
        */

        public append(q: Quaternion, rst: Quaternion = null): Quaternion {
            const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
            const x = this.x * q.w + this.w * q.x + this.z * q.y - this.y * q.z;
            const y = this.y * q.w + this.w * q.y + this.x * q.z - this.z * q.x;
            const z = this.z * q.w + this.w * q.z + this.y * q.x - this.x * q.y;

            return rst ? rst.setFromNumbers(x, y, z, w) : new Quaternion(x, y, z, w);
        }

        public rotateXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            //let m = this.toMatrix33();
            //return m.transform33XYZ(x, y, z, rst);
            
            rst = rst || new Vector3();

            const w1 = -x * this.x - y * this.y - z * this.z;
            const x1 = this.w * x + this.y * z - this.z * y;
            const y1 = this.w * y - this.x * z + this.z * x;
            const z1 = this.w * z + this.x * y - this.y * x;

            rst.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            rst.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            rst.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return rst;
        }

        public rotateVector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.rotateXYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public toMatrix33(rst: Matrix44 = null): Matrix44 {
            const x2 = this.x * 2, y2 = this.y * 2, z2 = this.z * 2;
            const xx = this.x * x2;
            const xy = this.x * y2;
            const xz = this.x * z2;
            const yy = this.y * y2;
            const yz = this.y * z2;
            const zz = this.z * z2;
            const wx = this.w * x2;
            const wy = this.w * y2;
            const wz = this.w * z2;

            if (rst) {
                rst.m00 = 1 - yy - zz;
                rst.m01 = xy + wz;
                rst.m02 = xz - wy;

                rst.m10 = xy - wz;
                rst.m11 = 1 - xx - zz;
                rst.m12 = yz + wx;

                rst.m20 = xz + wy;
                rst.m21 = yz - wx;
                rst.m22 = 1 - xx - yy;
            } else {
                rst = new Matrix44(
                    1 - yy - zz, xy + wz, xz - wy, 0,
                    xy - wz, 1 - xx - zz, yz + wx, 0,
                    xz + wy, yz - wx, 1 - xx - yy);
            }

            return rst;
        }

        public toMatrix44(rst: Matrix44 = null): Matrix44 {
            rst = this.toMatrix33(rst);

            rst.m03 = 0;
            rst.m13 = 0;
            rst.m23 = 0;

            rst.m30 = 0;
            rst.m31 = 0;
            rst.m32 = 0;
            rst.m33 = 1;

            return rst;
        }

        public toString(): string {
            return "Quaternion(x=" + this.x + ", y=" + this.y + ", z=" + this.z + ", w=" + this.w + ")";
        }
    }
}