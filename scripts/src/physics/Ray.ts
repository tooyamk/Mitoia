namespace MITOIA {
    export class Ray {
        public readonly origin: Vector3 = Vector3.Zero;
        public readonly direction: Vector3 = Vector3.Front;

        constructor(origin: Vector3 = Vector3.Zero, direction: Vector3 = Vector3.Front) {
            if (origin) this.origin.setFromVector3(origin);
            if (direction) this.direction.setFromVector3(direction);
        }

        public clone(): Ray {
            return new Ray(this.origin.clone(), this.direction.clone());
        }

        public transform34(m: Matrix44, rst: Ray = null): Ray {
            rst = rst || this;

            m.transform34Vector3(this.origin, rst.origin);
            m.transform33Vector3(this.direction, rst.direction);

            return rst;
        }

        public cast(root: Node, layerMask: uint = 0xFFFFFFFF, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            if (rst) {
                rst.clear();
            } else {
                rst = new RaycastHit();
            }

            if (root) {
                let ray = this.clone();
                let hit = new RaycastHit();
                let vec3 = new Vector3();
                this._castNode(root, layerMask, ray, cullFace, rst, hit, vec3);

                if (rst.node) {
                    rst.distance = Math.sqrt(rst.distanceSquared);
                    rst.normal.normalize();
                    rst.node.readonlyWorldMatrix.transform33Vector3(rst.normal, rst.normal);
                }
            }

            return rst;
        }

        private _castNode(node: Node, layerMask: uint, ray: Ray, cullFace: GLCullFace, rstHit: RaycastHit, tmpHit: RaycastHit, tmpVec3: Vector3): void {
            if (node.layer & layerMask) {
                let collider = node.getComponentByType(Collider, true);
                if (collider && collider.shape) {
                    this.transform34(node.readonlyInverseWorldMatrix, ray);
                    collider.shape.intersectRay(ray, cullFace, tmpHit);
                    if (tmpHit.distance >= 0) {
                        let x = ray.direction.x * tmpHit.distance;
                        let y = ray.direction.y * tmpHit.distance;
                        let z = ray.direction.z * tmpHit.distance;

                        node.readonlyWorldMatrix.transform34XYZ(x, y, z, tmpVec3);

                        x = tmpVec3.x - this.origin.x;
                        y = tmpVec3.y - this.origin.y;
                        z = tmpVec3.z - this.origin.z;
                        let disSqr = x * x + y * y + z * z;

                        if (!rstHit.node || rstHit.distanceSquared > disSqr) {
                            rstHit.node = node;
                            rstHit.distanceSquared = disSqr;
                            rstHit.normal.setFromVector3(tmpHit.normal);
                        }
                    }
                }
            }

            let child = node._childHead;
            while (child) {
                this._castNode(child, layerMask, ray, cullFace, rstHit, tmpHit, tmpVec3);
                child = child._next;
            }
        }
    }
}