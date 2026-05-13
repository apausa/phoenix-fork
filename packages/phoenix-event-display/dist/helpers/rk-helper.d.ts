import { Vector3 } from 'three';
/**
 * Helper methods for RungeKutta functions.
 */
export declare class RKHelper {
    /**
     * Function used by the extrapolator to check if the extrapolation should continue.
     * @param pos Location to be tested
     * @returns A boolean: true, if the position is in-bounds, false otherwise.
     */
    static extrapolationLimit(pos: Vector3): boolean;
    /**
     * Get extrapolated tracks using RungeKutta.
     * @param tracksCollectionsEvent Event containing tracks collections.
     */
    static getTracksWithRungeKutta(tracksCollectionsEvent: any): {};
    /**
     * Extrapolate tracks using RungeKutta propagator.
     * @param track Track which is to be extrapolated.
     * @param inbounds Function which returns true until the passed position
     * is out of bounds, when it returns false. Default is RKHelper.extrapolationLimit
     * @returns An array of track positions.
  
     */
    static extrapolateTrackPositions(track: {
        dparams: any;
    }, inbounds?: (pos: Vector3) => boolean): any;
    /**
     * Extrapolate track from its last measured position out to a given transverse radius.
     * Returns only the appended positions (does not include the last measured point).
     * @param track Track which is to be extrapolated (should have `pos` and `dparams`)
     * @param radius transverse radius in mm to extrapolate to
     */
    static extrapolateFromLastPosition(track: {
        pos?: number[][];
        dparams?: any;
    }, radius: number): number[][];
}
