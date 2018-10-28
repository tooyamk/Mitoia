namespace Aurora {
    export class SkeletonAnimationClip extends AbstractAnimationClip {
        public frames: SkeletonAnimationClip.Frame[] = null;

        public update(elapsed: number): void {

        }
    }

    export namespace SkeletonAnimationClip {
        export class Frame {
            public time: number = 0;
            public translation: Vector3 = null;
            public rotation: Quaternion = null;
            public scale: Vector3 = null;
        }
    }
}