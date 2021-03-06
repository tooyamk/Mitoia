
///<reference path="Vector.ts"/>

namespace Aurora.MathUtils {
    export const ZERO_TOLERANCE: number = 1E-6;//Number.EPSILON;
    export const EPSILON_SQ = Number.EPSILON * Number.EPSILON;
    export const PI2: number = Math.PI * 2;
    export const PI_2: number = Math.PI * 0.5;
    export const RAD_2_DEG: number = 180 / Math.PI;
    export const DEG_2_RAD: number = Math.PI / 180;

    export function fastSin(x: number): number {
        if (x < -3.14159265) {
            x += 6.28318531;
        } else if (x > 3.14159265) {
            x -= 6.28318531;
        }

        if (x < 0) {
            x = (1.27323954 + 0.405284735 * x) * x;
            return x < 0 ? 0.225 * (x * -x - x) + x : 0.225 * (x * x - x) + x;
        } else {
            x = (1.27323954 - 0.405284735 * x) * x;
            return x < 0 ? 0.225 * (x * -x - x) + x : 0.225 * (x * x - x) + x;
        }
    }

    export function isEqual(value: number, to: number, tolerance: number = Number.EPSILON): boolean {
        if (tolerance < 0) tolerance = -tolerance;
        return value >= to - tolerance && value <= to + tolerance;
    }

    export function lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    export function clamp(value: number, min: number, max: number): number {
        return value < min ? min : (value > max ? max : value);
    }

    export function clamp01(value: number): number {
        return value < 0 ? 0 : (value > 1 ? 1 : value);
    }

    export function isPowOfTow(n: uint): boolean {
        return !(n & (n - 1));
    }

    /**
     * @param mode 0 = nearest, 1 = larger, 2 = smaller.
     */
    export function powOfTow(n: uint, mode: uint = 0): uint {
        let pot: uint = n;
        if ((n & (n - 1))) {
            if (n !== 0) {
                --n;
                n |= n >> 1;
                n |= n >> 2;
                n |= n >> 4;
                n |= n >> 8;
                n |= n >> 16;
                pot = n + 1;

                if (mode !== 1) {
                    if (mode === 2) {
                        pot >>= 1;
                    } else {
                        if (pot - (n >> 1) > n - pot) pot >>= 1;
                    }
                }
            }
        }

        return pot;
    }

    /**
     * @param begin lineBeginPoint.
     * @param end lineEndPoint.
     */
    export function getFootOfPerpendicular(begin: Vector3, end: Vector3, pt: Vector3, rst: Vector3 = null): Vector3 {
        rst = rst || new Vector3();

        const dx = end.x - begin.x;
        const dy = end.y - begin.y;
        const dz = end.z - begin.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        if (this.isEqual(lenSq, 0)) return null;

        const u = ((begin.x - pt.x) * dx + (begin.y - pt.y) * dy + (begin.z - pt.z) * dz) / lenSq;

        rst.x = begin.x - u * dx;
        rst.y = begin.y - u * dy;
        rst.z = begin.z - u * dz;

        return rst;
    }

    export function getProjectionPointIntoPlane(p: Vector3, planePoint: Vector3, planeNormal: Vector3, rst: Vector3 = null): Vector3 {
        const a = planePoint;
        const n = planeNormal;

        const xx = n.x * n.x;
        const xy = n.x * n.y;
        const xz = n.x * n.z;
        const yy = n.y * n.y;
        const yz = n.y * n.z;
        const zz = n.z * n.z;
        const lenSq = xx + yy + zz;

        const x = (xy * a.y + yy * p.x - xy * p.y + xz * a.z + zz * p.x - xz * p.z + xx * a.x) / lenSq;
        const y = (yz * a.z + zz * p.y - yz * p.z + xy * a.x + xx * p.y - xy * p.x + yy * a.y) / lenSq;
        const z = (xz * a.x + xx * p.z - xz * p.x + yz * a.y + yy * p.z - yz * p.y + zz * a.z) / lenSq;

        return rst ? rst.setFromNumbers(x, y, z) : new Vector3(x, y, z);
    }

    export function getLinesIntersectionPoint(point1: Vector3, vector1: Vector3, point2: Vector3, vector2: Vector3, rst: Vector3 = null, tolerance: number = Number.EPSILON): Vector3 {
        const x1 = vector1.x;
        const x2 = point2.x - point1.x;
        const x3 = point2.x + vector2.x - point1.x;

        const y1 = vector1.y;
        const y2 = point2.y - point1.y;
        const y3 = point2.y + vector2.y - point1.y;

        const z1 = vector1.z;
        const z2 = point2.z - point1.z;
        const z3 = point2.z + vector2.z - point1.z;

        const x1y2 = x1 * y2;
        const x1y3 = x1 * y3;
        const x2y1 = x2 * y1;
        const x3y1 = x3 * y1;
        const x3z1 = x3 * z1;

        if (isEqual(x1y2, x2y1, tolerance) && isEqual(x1y3, x3y1, tolerance) && isEqual(x1 * z3, x3z1, tolerance)) {
            return null;
        } else {
            const x2y3 = x2 * y3;
            const x3y2 = x3 * y2;
            if (!isEqual(x1y2 * z3 + x2y3 * z1 + x3y1 * z2 - x3y2 * z1 - x1y3 * z2 - x2y1 * z3, 0, tolerance)) {
                return null;
            } else if (isEqual(x3y1 - x2y1, x1y3 - x1y2, tolerance) && isEqual((x3 - x2) * z1, (z3 - z2) * x1, tolerance)) {
                return null;
            } else {
                const len = x3y1 + y2 * x1 - y3 * x1 - x2y1;
                const x = (x1 * x3y2 - x1 * x2y3) / len + point1.x;
                const y = (x3y1 * y2 - x2y1 * y3) / len + point1.y;
                const z = (x3z1 * y2 - x2y1 * y3) / len + point1.z;

                return rst ? rst.setFromNumbers(x, y, z) : new Vector3(x, y, z);
            }
        }
    }
}