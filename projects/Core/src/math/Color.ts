namespace Aurora {
    export class Color3 {
        public static readonly CONST_WHITE: Color3 = new Color3(1, 1, 1);

        public r: number;
        public g: number;
        public b: number;

        constructor(r: number = 0, g: number = 0, b: number = 0) {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        public static get WHITE(): Color3 {
            return new Color3(1, 1, 1);
        }

        public static get BLACK(): Color3 {
            return new Color3(0, 0, 0);
        }

        public get isWhite(): boolean {
            return this.r === 1 && this.g === 1 && this.b === 1;
        }

        public clone(): Color3 {
            return new Color3(this.r, this.g, this.b);
        }

        public setRGB(rgb: uint): Color3 {
            this.r = (rgb >> 16 & 0xFF) / 0xFF;
            this.g = (rgb >> 8 & 0xFF) / 0xFF;
            this.b = (rgb & 0xFF) / 0xFF;

            return this;
        }

        public setFromNumbers(r: number = 0, g: number = 0, b: number = 0): Color3 {
            this.r = r;
            this.g = g;
            this.b = b;

            return this;
        }

        public set(c: Color3 | Color4): Color3 {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;

            return this;
        }

        public isEqual(c: Color3): boolean {
            return this.r === c.r && this.g === c.g && this.b === c.b;
        }

        public toString(): string {
            return "Color3(r=" + this.r + ", g=" + this.g + ", b=" + this.b + ")";
        }
    }

    export class Color4 {
        public static readonly CONST_WHITE: Color4 = new Color4(1, 1, 1, 1);

        public r: number;
        public g: number;
        public b: number;
        public a: number;

        constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        public static get WHITE(): Color4 {
            return new Color4(1, 1, 1, 1);
        }

        public static get BLACK(): Color4 {
            return new Color4(0, 0, 0, 1);
        }

        public static get TRANSPARENT_BLACK(): Color4 {
            return new Color4(0, 0, 0, 0);
        }

        public get isWhite(): boolean {
            return this.r === 1 && this.g === 1 && this.b === 1 && this.a === 1;
        }

        public clone(): Color4 {
            return new Color4(this.r, this.g, this.b, this.a);
        }

        public toColor3(rst: Color3 = null): Color3 {
            return rst ? rst.setFromNumbers(this.r, this.g, this.b) : new Color3(this.r, this.g, this.b);
        }

        public setRGB(rgb: uint): Color4 {
            this.r = (rgb >> 16 & 0xFF) / 0xFF;
            this.g = (rgb >> 8 & 0xFF) / 0xFF;
            this.b = (rgb & 0xFF) / 0xFF;

            return this;
        }

        public setARGB(argb: uint): Color4 {
            this.a = (argb >> 24 & 0xFF) / 0xFF;
            this.r = (argb >> 16 & 0xFF) / 0xFF;
            this.g = (argb >> 8 & 0xFF) / 0xFF;
            this.b = (argb & 0xFF) / 0xFF;

            return this;
        }

        public setRGBA(rgba: uint): Color4 {
            this.r = (rgba >> 24 & 0xFF) / 0xFF;
            this.g = (rgba >> 16 & 0xFF) / 0xFF;
            this.b = (rgba >> 8 & 0xFF) / 0xFF;
            this.a = (rgba & 0xFF) / 0xFF;

            return this;
        }

        public setFromNumbers(r: number = 0, g: number = 0, b: number = 0, a: number = 1): Color4 {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;

            return this;
        }

        public set(c: Color4): Color4 {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = c.a;

            return this;
        }

        public setFromColor3(c: Color3): Color4 {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;

            return this;
        }

        public isEqualColor3(c: Color3 | Color4): boolean {
            return this.r === c.r && this.g === c.g && this.b === c.b;
        }

        public isEqualColor4(c: Color4): boolean {
            return this.r === c.r && this.g === c.g && this.b === c.b && this.a === c.a;
        }

        public static isEqual(c0: Color4, v1: Color4): boolean {
            if (c0 === v1) return true;
            if (c0) {
                return v1 ? c0.r === v1.r && c0.g === v1.g && c0.b === v1.b && c0.a === v1.a : false;
            }
            return !v1;
        }

        public mul(c: Color4): Color4 {
            this.r *= c.r;
            this.g *= c.g;
            this.b *= c.b;
            this.a *= c.a;

            return this;
        }

        public static mul(c1: Color4, c2: Color4, rst: Color4 = null): Color4 {
            const r = c1.r * c2.r;
            const g = c1.g * c2.g;
            const b = c1.b * c2.b;
            const a = c1.a * c2.a;

            return rst ? rst.setFromNumbers(r, g, b, a) : new Color4(r, g, b, a);
        }

        public toString(): string {
            return "Color4(r=" + this.r + ", g=" + this.g + ", b=" + this.b + ", a=" + this.a + ")";
        }
    }
}