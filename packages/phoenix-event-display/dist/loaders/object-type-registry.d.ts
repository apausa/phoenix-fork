import { Object3D } from 'three';
import { GUI } from 'dat.gui';
import { Cut } from '../lib/models/cut.model';
import { PhoenixMenuNode } from '../managers/ui-manager/phoenix-menu/phoenix-menu-node';
/** Describes how to load a single physics object type. */
export interface ObjectTypeConfig {
    /** Key in eventData (e.g. 'Tracks', 'Jets'). */
    typeName: string;
    /** Builds one Three.js object from params. */
    getObject: (params: any, typeName?: string) => Object3D;
    /** If true, pass the whole collection at once instead of per-object. */
    concatonateObjs?: boolean;
    /** Default cut definitions for this type. */
    cuts?: Cut[];
    /** Scale UI config — if set, a scale slider is added. */
    scaleConfig?: {
        /** Config key for dat.GUI. */
        key: string;
        /** Display label. */
        label: string;
        /** Scene manager scale method name. */
        scaleMethod: string;
        /** Axis to scale along. */
        scaleAxis?: string;
    };
    /** Completely custom UI extension (used by MissingEnergy). */
    extendUI?: (typeFolder: GUI, typeFolderPM: PhoenixMenuNode, scaleChildObjects: (typeName: string, value: number) => void) => void;
    /** Custom pre-processing for event data before addObjectType. */
    preprocessData?: (data: any) => any;
}
/** Returns default configs for all built-in Phoenix object types. */
export declare function getDefaultObjectTypeConfigs(): ObjectTypeConfig[];
