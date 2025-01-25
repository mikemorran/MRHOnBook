// Sample scene.d.ts

import { Backdrop } from "./backdrop";
import { Sample } from "./Sample";
import { Annotation } from "./Annotation";

export interface Scene {
    name : string;
    recordedOn : string;
    backdrop : Backdrop;
    samples : Sample[];
    annotations : Annotation[];
}
