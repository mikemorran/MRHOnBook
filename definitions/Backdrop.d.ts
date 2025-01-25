import { Vector3 } from "./vector3";

export interface Backdrop {
    mesh : File;
    transform: {
        rotation: Vector3;
        scale: Vector3;
    };
    offsetTransform : {
        position : Vector3;
        rotation : Vector3;
        scale : Vector3;
    };
}