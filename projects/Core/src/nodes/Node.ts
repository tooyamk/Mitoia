namespace Aurora {
    export class Node extends Ref {
        protected static _tmpVec3 = Vector3.Zero;
        protected static _tmpMat = new Matrix44();

        protected static readonly LOCAL_MATRIX_DIRTY: uint = 0b1;
        protected static readonly WORLD_MATRIX_DIRTY: uint = 0b10;
        protected static readonly INVERSE_WORLD_MATRIX_DIRTY: uint = 0b100;
        protected static readonly WORLD_ROTATION_DIRTY: uint = 0b1000;
        protected static readonly WORLD_AND_INVERSE_MATRIX_DIRTY: uint = Node.WORLD_MATRIX_DIRTY | Node.INVERSE_WORLD_MATRIX_DIRTY;
        protected static readonly WORLD_ALL_DIRTY: uint = Node.WORLD_AND_INVERSE_MATRIX_DIRTY | Node.WORLD_ROTATION_DIRTY;
        protected static readonly LOCAL_AND_WORLD_ALL_DIRTY: uint = Node.LOCAL_MATRIX_DIRTY | Node.WORLD_ALL_DIRTY;
        protected static readonly LOCAL_AND_WORLD_EXCEPT_WORLD_ROTATION_DIRTY: uint = Node.LOCAL_AND_WORLD_ALL_DIRTY & (~Node.WORLD_ROTATION_DIRTY);
        protected static readonly ALL_MATRIX_DIRTY: uint = Node.LOCAL_MATRIX_DIRTY | Node.WORLD_AND_INVERSE_MATRIX_DIRTY;

        protected static readonly CASCADE_COLOR_DIRTY: uint = 0b10000;

        public name = "";
        public layer: uint = 0x7FFFFFFF;
        public active = true;

        protected _parent: Node = null;
        protected _root: Node = null;

        public _prev: Node = null;
        public _next: Node = null;

        public _childHead: Node = null;
        protected _numChildren: uint = 0;
        protected _traversingStack: Node[] = null;

        protected _components: Node.AbstractComponent[] = null;

        protected _localRot = new Quaternion();
        protected _localScale = Vector3.One;

        protected _localMatrix = new Matrix44();

        protected _worldRot = new Quaternion();
        protected _worldMatrix = new Matrix44();
        protected _inverseWorldMatrix = new Matrix44();

        protected _color: Color4 = null;
        protected _cascadeColor: Color4 = null;

        protected _dirty: uint = 0;

        constructor() {
            super();

            this._root = this;
        }

        public get root(): Node {
            return this._root;
        }

        public get parent(): Node {
            return this._parent;
        }

        /**
         * @returns If operate succeed, return child, else return null.
         */
        public addChild(c: Node): Node {
            if (c && c._parent === null && c !== this._root) {
                c.retain();
                this._addNode(c);
                c._parentChanged(this._root);
                return c;
            }
            return null;
        }

        /**
         * @returns If operate succeed, return child, else return null.
         */
        public insertChild(c: Node, before: Node): Node {
            if (c && c !== this._root) {
                if (c === before) return c;

                if (before) {
                    if (before._parent === this) {
                        if(c._parent === this) {
                            this._removeNode(c);
                            this._insertNode(c, before);
                            return c;
                        } else if (c._parent === null) {
                            c.retain();
                            this._insertNode(c, before);
                            return c;
                        }
                    }
                } else {
                    return this.addChild(c);
                }
            }

            return null;
        }

        public removeChild(c: Node): boolean {
            if (c && c._parent === this) {
                this._removeNode(c);
                c._parentChanged(c);
                c.release();
                return true;
            }
            return false;
        }

        public removeFromParent(): boolean {
            return this._parent ? this._parent.removeChild(this) : false;
        }

        protected _parentChanged(root: Node): void {
            this._root = root;

            let sendDirty = Node.WORLD_ALL_DIRTY;

            const p = this._parent;
            if (p) {
                p.updateMCascadeColor();
                if (p._cascadeColor) {
                    if (this._cascadeColor) {
                        if (!this._cascadeColor.isEqualColor4(p._cascadeColor)) sendDirty |= Node.CASCADE_COLOR_DIRTY;
                    } else {
                        if (!p._cascadeColor.isWhite) sendDirty |= Node.CASCADE_COLOR_DIRTY;
                    }
                } else {
                    if (this._cascadeColor && !this._cascadeColor.isWhite) sendDirty |= Node.CASCADE_COLOR_DIRTY;
                }
            } else {
                if (this._cascadeColor && !this._cascadeColor.isWhite) sendDirty |= Node.CASCADE_COLOR_DIRTY;
            }

            const old = this._dirty;
            this._dirty |= sendDirty;
            if (old !== this._dirty) this._noticeUpdate(sendDirty);
        }

        public get numChildren(): uint {
            return this._numChildren;
        }

        public get readonlyLocalRotation(): Quaternion {
            return this._localRot;
        }

        public get readonlyLocalScale(): Vector3 {
            return this._localScale;
        }

        public get readonlyLocalMatrix(): Matrix44 {
            this.updateLocalMatrix();
            return this._localMatrix;
        }

        public get readonlyWorldMatrix(): Matrix44 {
            this.updateWorldMatrix();
            return this._worldMatrix;
        }

        public get readonlyInverseWorldMatrix(): Matrix44 {
            this.updateInverseWorldMatrix();
            return this._inverseWorldMatrix;
        }

        public get readonlyWorldRotation(): Quaternion {
            this.updateWorldRotation();
            return this._worldRot;
        }

        public get readonlyColor4(): Color4 {
            return this._color ? this._color : Color4.CONST_WHITE;
        }

        public get readonlyCascadeColor(): Color4 {
            this.updateMCascadeColor();
            return this._cascadeColor ? this._cascadeColor : (this._color ? this._color : Color4.CONST_WHITE);
        }

        [Symbol.iterator]() {
            let next = this._childHead;

            return {
                done: false,
                value: <Node>null,
                next() {
                    if (next) {
                        this.value = next;
                        next = next._next;
                    } else {
                        this.value = null;
                    }
                    this.done = this.value === null;

                    return this;
                }
            };
        }

        public clone(cloneChildren: boolean): Node {
            const n = new Node();
            n.name = this.name;
            n.setLocalScale(this._localScale.x, this._localScale.y, this._localScale.z);
            n.setLocalRotation(this._localRot);
            n.setLocalPosition(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32);
            if (this._color) n.setColor4(this._color);

            if (cloneChildren) {
                let child = this._childHead;
                while (child) {
                    n.addChild(child.clone(true));
                    child = child._next;
                }
            }

            return n;
        }

        /**
         * @returns numChildren.
         */
        public getAllChildren(rst: Node[], start: uint = 0): Node[] {
            rst = rst || [];
            
            let node = this._childHead;
            while (node) {
                rst[start++] = node;
                node = node._next;
            }

            return rst;
        }

        public removeAllChildren(): void {
            if (this._childHead) {
                if (this._traversingStack) {
                    for (let i = 0, n = this._traversingStack.length; i < n; ++i) this._traversingStack[i] = null;
                }

                let node = this._childHead;
                do {
                    const next = node._next;

                    node._prev = null;
                    node._next = null;
                    node._parent = null;
                    node._parentChanged(node);
                    node.release();

                    node = next;
                } while (node);

                this._childHead = null;
                this._numChildren = 0;
            }
        }

        public get alpha(): number {
            return this._color ? this._color.a : 1;
        }

        public set alpha(a: number) {
            if (this._color) {
                if (this._color.a !== a) {
                    this._color.a = a;
                    this._colorChanged();
                }
            } else if (a !== 1) {
                this._color = new Color4(1, 1, 1, a);
                this._colorChanged();
            }
        }

        public getColor3(rst: Color3 = null): Color3 {
            if (this._color) {
                return this._color.toColor3(rst);
            } else {
                return rst ? rst.set(Color3.CONST_WHITE) : Color3.WHITE;
            }
        }

        public setColor3(c: Color3): void {
            if (this._color) {
                if (!this._color.isEqualColor3(c)) {
                    this._color.setFromColor3(c);
                    this._colorChanged();
                }
            } else {
                if (!c.isWhite) {
                    this._color = new Color4(c.r, c.g, c.b, 1);
                    this._colorChanged();
                }
            }
        }

        public getColor4(rst: Color4 = null): Color4 {
            if (this._color) {
                return rst ? rst.set(this._color) : this._color.clone();
            } else {
                return rst ? rst.set(Color4.CONST_WHITE) : Color4.WHITE;
            }
        }

        public setColor4(c: Color4): void {
            if (this._color) {
                if (!this._color.isEqualColor4(c)) {
                    this._color.set(c);
                    this._colorChanged();
                }
            } else {
                if (!c.isWhite) {
                    this._color = c.clone();
                    this._colorChanged();
                }
            }
        }

        protected _colorChanged(): void {
            const old = this._dirty;
            this._dirty |= Node.CASCADE_COLOR_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.CASCADE_COLOR_DIRTY);
        }

        public getCascadeColor(rst: Color4 = null): Color4 {
            this.updateMCascadeColor();
            if (this._cascadeColor) {
                return rst ? rst.set(this._cascadeColor) : this._cascadeColor.clone();
            } else {
                return this.getColor4(rst);
            }
        }

        public updateMCascadeColor(): void {
            if (this._dirty & Node.CASCADE_COLOR_DIRTY) {
                this._dirty &= ~Node.CASCADE_COLOR_DIRTY;

                if (this._parent) {
                    const c = this._parent.readonlyCascadeColor;
                    if (this._color) {
                        this._cascadeColor = Color4.mul(this._color, c, this._cascadeColor);
                    } else {
                        this._cascadeColor = this._cascadeColor ? this._cascadeColor.set(c) : c.clone();
                    }
                } else {
                    if (this._color && this._cascadeColor) this._cascadeColor.set(this._color);
                }
            }
        }

        /**
         * @param callback if return false, break.
         */
        public foreach(callback: (child: Node) => boolean): void {
            if (callback && this._childHead) {
                let node = this._childHead;
                if (!this._traversingStack) this._traversingStack = [];
                const n = this._traversingStack.length;
                while (node) {
                    this._traversingStack[n] = node._next;
                    if (!callback(node)) break;
                    node = this._traversingStack[n];
                }
                this._traversingStack.length = n;
            }
        }

        protected _addNode(node: Node): void {
            if (this._childHead) {
                let tail = this._childHead._prev;

                tail._next = node;
                node._prev = tail;
                this._childHead._prev = node;
            } else {
                this._childHead = node;
                node._prev = node;
            }

            node._parent = this;
            ++this._numChildren;
        }

        protected _insertNode(node: Node, before: Node): void {
            node._next = before;
            node._prev = before._prev;
            if (before === this._childHead) {
                this._childHead = node;
            } else {
                before._prev._next = node;
            }
            before._prev = node;

            node._parent = this;
            ++this._numChildren;
        }

        protected _removeNode(node: Node): void {
            this._checkTraversingStack(node);

            const next = node._next;

            if (this._childHead === node) {
                this._childHead = next;

                if (next) next._prev = node._prev;
            } else {
                const prev = node._prev;

                prev._next = next;
                if (next) {
                    next._prev = prev;
                } else {
                    this._childHead._prev = prev;
                }
            }

            node._prev = null;
            node._next = null;
            node._parent = null;

            --this._numChildren;
        }

        protected _checkTraversingStack(node: Node): void {
            if (this._traversingStack) {
                for (let i = 0, n = this._traversingStack.length; i < n; ++i) {
                    if (this._traversingStack[i] === node) this._traversingStack[i] = node._next;
                }
            }
        }

        public addComponent<T extends Node.AbstractComponent>(component: T): T {
            if (component && component.node !== this) {
                if (!this._components) this._components = [];
                component.retain();
                if (component.node) component.node._removeComponent(component);
                this._components[this._components.length] = component;
                component._setNode(this);
            }

            return component;
        }

        public removeComponent(component: Node.AbstractComponent): void {
            if (component && component.node === this) {
                component._setNode(null);
                this._removeComponent(component);
            }
        }

        protected _removeComponent(component: Node.AbstractComponent): void {
            this._components.splice(this._components.indexOf(component), 1);
            component.release();
        }

        public remvoeAllComponents(): void {
            if (this._components) {
                for (let i = 0, val: Node.AbstractComponent; val = this._components[i++];) {
                    val._setNode(null);
                    val.release();
                }
                this._components.length = 0;
            }
        }

        public getComponentByType<T extends Node.AbstractComponent>(c: {prototype: T}, checkEnabled: boolean = true): T {
            if (this._components) {
                const type = <any>c;

                for (let i = 0, n = this._components.length; i < n; ++i) {
                    const com = this._components[i];
                    if (checkEnabled && !com.enabled) continue;
                    if (com instanceof type) return <T>com;
                }
            }

            return null;
        }

        public getComponentsByType<T extends Node.AbstractComponent>(c: { prototype: T }, checkEnabled: boolean = true, rst: T[] = null, rstOffset: uint = 0): uint {
            let num = 0;

            if (this._components) {
                const type = <any>c;

                for (let i = 0, n = this._components.length; i < n; ++i) {
                    const com = this._components[i];
                    if (checkEnabled && !com.enabled) continue;
                    if (com instanceof type) rst[rstOffset + num++] = <T>com;
                }
            }

            return num;
        }

        protected _noticeUpdate(dirty: uint): void {
            let node = this._childHead;
            while (node) {
                node._receiveNoticeUpdate(dirty);
                node = node._next;
            }
        }

        protected _receiveNoticeUpdate(dirty: uint): void {
            const old = this._dirty;
            this._dirty |= dirty;
            if (this._dirty !== old) this._noticeUpdate(dirty);
        }

        public getLocalToLocalMatrix(to: Node, rst: Matrix44 = null): Matrix44 {
            if (to && this._root === to._root) {
                return this.readonlyWorldMatrix.append34(to.readonlyInverseWorldMatrix, rst);
            } else {
                return rst ? rst.identity() : new Matrix44();
            }
        }

        public getLocalToProjectionMatrix(camera: Camera, rst: Matrix44 = null): Matrix44 {
            if (camera) {
                return this.getLocalToLocalMatrix(camera.node, rst).append44(camera.readonlyProjectionMatrix, rst);
            } else {
                return rst ? rst.identity() : new Matrix44();
            }
        }

        public getLocalPositon(rst: Vector3 = null): Vector3 {
            return rst ? rst.setFromNumbers(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32) : new Vector3(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32);
        }

        public setLocalPosition(x: number = 0, y: number = 0, z: number = 0): void {
            this._localMatrix.m30 = x;
            this._localMatrix.m31 = y;
            this._localMatrix.m32 = z;

            const old = this._dirty;
            this._dirty |= Node.WORLD_AND_INVERSE_MATRIX_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_AND_INVERSE_MATRIX_DIRTY);
        }

        public localTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            this.readonlyLocalMatrix.prependTranslate34XYZ(x, y, z);

            const old = this._dirty;
            this._dirty |= Node.WORLD_AND_INVERSE_MATRIX_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_AND_INVERSE_MATRIX_DIRTY);
        }

        public getWorldPosition(rst: Vector3 = null): Vector3 {
            this.updateWorldMatrix();

            return rst ? rst.setFromNumbers(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32) : new Vector3(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32);
        }

        public setWorldPosition(x: number = 0, y: number = 0, z: number = 0): void {
            const old = this._dirty;
            this.updateWorldMatrix();

            this._worldMatrix.m30 = x;
            this._worldMatrix.m31 = y;
            this._worldMatrix.m32 = z;

            this._worldPositionChanged(old);
        }

        public worldTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            const old = this._dirty;
            this.readonlyWorldMatrix.prependTranslate34XYZ(x, y, z);

            this._worldPositionChanged(old);
        }

        protected _worldPositionChanged(oldDirty: uint): void {
            if (this._parent) {
                const vec3 = this._parent.readonlyInverseWorldMatrix.transform34XYZ(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32, Node._tmpVec3);
                
                this._localMatrix.m30 = vec3.x;
                this._localMatrix.m31 = vec3.y;
                this._localMatrix.m32 = vec3.z;
            } else {
                this._localMatrix.m30 = this._worldMatrix.m30;
                this._localMatrix.m31 = this._worldMatrix.m31;
                this._localMatrix.m32 = this._worldMatrix.m32;
            }

            this._dirty |= Node.INVERSE_WORLD_MATRIX_DIRTY;
            if (oldDirty !== this._dirty) this._noticeUpdate(Node.WORLD_AND_INVERSE_MATRIX_DIRTY);
        }

        public getLocalRotation(rst: Quaternion = null): Quaternion {
            return rst ? rst.set(this._localRot) : this._localRot.clone();
        }

        public setLocalRotation(q: Quaternion): void {
            this._localRot.set(q);

            const old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public localRotate(q: Quaternion): void {
            this._localRot.prepend(q);

            const old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public parentRotate(q: Quaternion): void {
            this._localRot.prepend(q);

            const old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public getWorldRotation(rst: Quaternion = null): Quaternion {
            return rst ? rst.set(this.readonlyWorldRotation) : this.readonlyWorldRotation.clone();
        }

        public setWorldRotation(q: Quaternion): void {
            this._worldRot.set(q);

            this._worldRotationChanged(this._dirty);
        }

        public worldRotate(q: Quaternion): void {
            const old = this._dirty;
            this.readonlyWorldRotation.prepend(q);

            this._worldRotationChanged(old);
        }

        protected _worldRotationChanged(oldDirty: uint): void {
            if (this._parent) {
                this._worldRot.append(this._parent.readonlyWorldRotation.invert(this._localRot), this._localRot);
                //this._parent.readonlyWorldRotation.append(this._worldRot, this._localRot);
            } else {
                this._localRot.set(this._worldRot);
            }

            this._dirty &= ~Node.WORLD_ROTATION_DIRTY;
            this._dirty |= Node.LOCAL_AND_WORLD_EXCEPT_WORLD_ROTATION_DIRTY;
            if (oldDirty !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        /**
         ** (this node).setLocalRotation(return value)
         ** (this node).worldRotation = Target world rotation
         * @param q Target world rotation
         */
        public getLocalRotationFromWorld(q: Quaternion, rst: Quaternion = null): Quaternion {
            if (this._parent) {
                rst = rst ? rst.set(this._parent.readonlyWorldRotation) : this._parent.readonlyWorldRotation.clone();
                rst.x = -rst.x;
                rst.y = -rst.y;
                rst.z = -rst.z;

                rst.prepend(q);
            } else {
                rst = rst ? rst.set(q) : q.clone();
            }

            return rst;
        }

        public getLocalScale(rst: Vector3 = null): Vector3 {
            return rst ? rst.set(this._localScale) : this._localScale.clone();
        }

        public setLocalScale(x: number, y: number, z: number): void {
            this._localScale.setFromNumbers(x, y, z);

            const old = this._dirty;
            this._dirty |= Node.ALL_MATRIX_DIRTY;
           if (old !== this._dirty)  this._noticeUpdate(Node.WORLD_AND_INVERSE_MATRIX_DIRTY);
        }

        public getLocalMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44(this.readonlyLocalMatrix) : this.readonlyLocalMatrix.clone();
        }

        public setLocalMatrix(m: Matrix44): void {
            this._localMatrix.set34(m);

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            const old = this._dirty;
            this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;
            this._dirty |= Node.WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public setLocalTRS(pos: Vector3, rot: Quaternion, scale: Vector3): void {
            this._localMatrix.m30 = pos.x;
            this._localMatrix.m31 = pos.y;
            this._localMatrix.m32 = pos.z;

            this._localRot.set(rot);

            this._localScale.set(scale);

            const old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public getWorldMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44(this.readonlyWorldMatrix) : this.readonlyWorldMatrix.clone();
        }

        public setWorldMatrix(m: Matrix44): void {
            this._worldMatrix.set34(m);

            const old = this._dirty;
            this._dirty &= ~Node.WORLD_MATRIX_DIRTY;
            this._dirty |= Node.INVERSE_WORLD_MATRIX_DIRTY;

            if (this._parent) {
                this._worldMatrix.append34(this.readonlyInverseWorldMatrix, this._localMatrix);
            } else {
                this._localMatrix.set34(this._worldMatrix);
            }

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;
            this._dirty |= Node.WORLD_ROTATION_DIRTY;
            if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
        }

        public getInverseWorldMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44(this.readonlyInverseWorldMatrix) : this.readonlyInverseWorldMatrix.clone();
        }

        public identity(): void {
            if (!this._localRot.isIdentity || !this._localScale.isOne || this._localMatrix.m30 !== 0 || this._localMatrix.m31 !== 0 || this._localMatrix.m32 !== 0) {
                this._localMatrix.identity();
                this._localRot.identity();
                this._localScale.set(Vector3.CONST_ONE);

                const old = this._dirty;
                this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
                if (old !== this._dirty) this._noticeUpdate(Node.WORLD_ALL_DIRTY);
            }
        }

        public updateWorldRotation(): void {
            if (this._dirty & Node.WORLD_ROTATION_DIRTY) {
                this._dirty &= ~Node.WORLD_ROTATION_DIRTY;

                if (this._parent) {
                    this._localRot.append(this._parent.readonlyWorldRotation, this._worldRot);
                } else {
                    this._worldRot.set(this._localRot);
                }
            }
        }

        public updateLocalMatrix(): void {
            if (this._dirty & Node.LOCAL_MATRIX_DIRTY) {
                this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;

                this._localRot.toMatrix33(this._localMatrix);
                this._localMatrix.prependScale34Vector3(this._localScale);
            }
        }

        public updateWorldMatrix(): void {
            if (this._dirty & Node.WORLD_MATRIX_DIRTY) {
                this._dirty &= ~Node.WORLD_MATRIX_DIRTY;

                if (this._parent) {
                    this.readonlyLocalMatrix.append34(this._parent.readonlyWorldMatrix, this._worldMatrix);
                } else {
                    this._worldMatrix.set34(this.readonlyLocalMatrix);
                }
            }
        }

        public updateInverseWorldMatrix(): void {
            if (this._dirty & Node.INVERSE_WORLD_MATRIX_DIRTY) {
                this._dirty &= ~Node.INVERSE_WORLD_MATRIX_DIRTY;

                this.readonlyWorldMatrix.invert(this._inverseWorldMatrix);
            }
        }

        public getChildByName(name: string, depth: uint = 0): Node {
            if (depth === 0) {
                let child = this._childHead;
                while (child) {
                    if (child.name === name) return child;
                    child = child._next;
                }
            } else if (depth > 0) {
                let arr1: Node[] = [this], arr2: Node[] = [];
                let len1 = 0, len2 = 0;

                do {
                    for (let i = 0; i < len1; ++i) {
                        let cur = arr1[i];
                        let c = cur._childHead;
                        while (c) {
                            if (c.name === name) return c;
                            arr2[len2++] = c;
                            c = c._next;
                        }
                    }

                    if (len2 === 0 && --depth <= 0) return null;

                    let tmpArr = arr1;
                    arr1 = arr2;
                    arr2 = tmpArr;

                    len1 = len2;
                    len2 = 0;
                } while(true);
            }

            return null;
        }

        public isContains(node: Node, depth: uint = Number.MAX_SAFE_INTEGER): int {
            if (node === this) {
                return 0;
            } else if (depth > 0 && node) {
                if (node._parent === this) {
                    return 1;
                } else if (depth > 1) {
                    let child = this._childHead;
                    while (child) {
                        const lv = child.isContains(node, depth - 1);
                        if (lv !== -1) return lv + 1;
                        child = child._next;
                    }

                    return -1;
                }

                return -1;
            } else {
                return -1;
            }
        }

        public destroy(): void {
            this.removeAllChildren();
            this.remvoeAllComponents();

            this._components = null;
            this._localRot = null;
            this._localScale = null;
            this._localMatrix = null;
            this._worldRot = null;
            this._worldMatrix = null;
            this._inverseWorldMatrix = null;
            this._color = null;
            this._cascadeColor = null;
            this._traversingStack = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }

    export namespace Node {
        export abstract class AbstractComponent extends Ref {
            protected _node: Node = null;
            protected _enabled = true;

            public get node(): Node {
                return this._node;
            }

            public _setNode(node: Node): void {
                const old = this._node;
                this._node = node;

                this._nodeChanged(old);
            }

            public get enabled(): boolean {
                return this._enabled;
            }

            public set enabled(b: boolean) {
                if (this._enabled !== b) {
                    this._enabled = b;

                    this._enabledChanged();
                }
            }

            public destroy(): void {
                if (this._node) this._node.removeComponent(this);
            }

            protected _refDestroy(): void {
                this.destroy();
            }

            protected _nodeChanged(old: Node): void {
                //override
            }

            protected _enabledChanged(): void {
                //override
            }
        }
    }
}