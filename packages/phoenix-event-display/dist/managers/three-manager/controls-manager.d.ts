import { Group as TweenGroup } from '@tweenjs/tween.js';
import { Camera, Object3D, Vector3, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from './renderer-manager';
/**
 * Manager for managing event display controls.
 */
export declare class ControlsManager {
    /** The main orbit controls. */
    private mainControls;
    /** The secondary orbit controls for overlay renderer. */
    private secondaryControls?;
    /** The renderer manager instance for accessing main and overlay renderers. */
    private renderr;
    /** Whether the overlay controls are linked to the main controls. */
    private _isOverlayLinked;
    /** Stored window resize handler for cleanup. */
    private resizeHandler;
    /** Stored OrbitControls change handler for cleanup. */
    private controlsChangeHandler;
    /** Track state for hideTubeTracksOnZoom. */
    private tracksHidden;
    /** Shared tween.js group for animations. */
    private tweenGroup;
    /**
     * Constructor for setting up all the controls.
     * @param rendererManager The renderer manager to get the main renderer.
     * @param defaultView The default camera position as [x, y, z] coordinates.
     * @param tweenGroup Shared tween.js group for animations.
     */
    constructor(rendererManager: RendererManager, defaultView?: number[], tweenGroup?: TweenGroup);
    /**
     * Set orbit controls for the camera.
     * @param camera The camera with which to create the orbit controls.
     * @param domElement DOM element of the renderer to associate the orbit controls with.
     * @returns Configured orbit controls.
     */
    private setOrbitControls;
    /**
     * Initialize overlay controls if an overlay renderer is available.
     * Creates orbit controls for the overlay camera using the same camera type as the main camera.
     */
    initOverlayControls(): void;
    /**
     * Set up to make camera(s) adapt to window resize.
     * @param rendererElement Canvas element of the main renderer.
     */
    private setupResize;
    /**
     * Set the main orbit controls.
     * @param controls Orbit controls to be set as main.
     */
    private setMainControls;
    /**
     * Set orbit controls for overlay.
     * @param controls Orbit controls to be set for overlay.
     */
    private setOverlayControls;
    /**
     * Get the main orbit controls.
     * @returns Main orbit controls.
     */
    getMainControls(): OrbitControls;
    /**
     * Get orbit controls for overlay.
     * @returns Orbit controls for overlay.
     */
    getOverlayControls(): OrbitControls | undefined;
    /**
     * Get the main camera.
     * @returns Main camera.
     */
    getMainCamera(): Camera;
    /**
     * Get the camera for overlay.
     * @returns The camera for overlay.
     */
    getOverlayCamera(): Camera | undefined;
    /**
     * Get the constructor type of the given camera.
     * @param camera The camera instance to check.
     * @returns The camera constructor (OrthographicCamera or PerspectiveCamera).
     */
    private returnType;
    /**
     * Get the opposite constructor type of the given camera.
     * @param camera The camera instance to check.
     * @returns The opposite camera constructor (PerspectiveCamera if input is Orthographic, vice versa).
     */
    private returnReverseType;
    /**
     * Create a camera instance of the specified type with appropriate settings.
     * @param cameraClass The camera constructor (PerspectiveCamera or OrthographicCamera).
     * @param domElement The DOM element to use for aspect ratio and dimensions.
     * @returns A new camera instance configured for the given element.
     */
    private CameraFactory;
    /**
     * Swap camera type for given orbit controls or canvas element.
     * Creates new orbit controls with a different camera type while preserving position and target.
     * @param input Either existing OrbitControls or HTMLCanvasElement to create controls for.
     * @param overridden The canvas element to use (defaults to input's domElement if input is OrbitControls).
     * @param cameraType The target camera type (defaults to opposite of current camera type).
     * @param Iaspect The aspect ratio to use for the new camera.
     * @returns New OrbitControls with the swapped camera type.
     */
    private swapCameraType;
    /**
     * Swap the camera type of orbit controls and create new controls with the new camera.
     * @param control Orbit controls to be reverted/swapped.
     * @returns New orbit controls with swapped camera type.
     */
    revertCamerabyControl(control: OrbitControls): OrbitControls;
    /**
     * Revert the camera to its inverse type. Default resulted type is Perspective.
     */
    revertCameraType(camera: Camera): void;
    /**
     * Synchronize a perspective camera from an orthographic camera.
     * Calculates the appropriate distance and position for the perspective camera to match
     * the view frustum of the orthographic camera at the orbit target.
     * @param source The source orthographic camera to sync from.
     * @param target The target perspective camera to sync to.
     * @param orbitTarget The point in 3D space that both cameras should focus on.
     */
    private syncPersFromOrtho;
    /**
     * Synchronize an orthographic camera from a perspective camera.
     * Calculates the appropriate frustum bounds for the orthographic camera to match
     * the field of view of the perspective camera at the orbit target distance.
     * @param source The source perspective camera to sync from.
     * @param target The target orthographic camera to sync to.
     * @param orbitTarget The point in 3D space that both cameras should focus on.
     * @param forcedAspectRation Optional aspect ratio override for the orthographic camera.
     */
    private syncOrthoFromPers;
    /**
     * Synchronize camera properties between two cameras.
     * Handles synchronization between all camera type combinations:
     * - Same type: copies position, orientation, and camera-specific properties
     * - Different types: uses specialized sync methods to maintain equivalent views
     * @param source The source camera to copy properties from.
     * @param target The target camera to copy properties to.
     * @param orbitTarget The orbit target point for cross-type synchronization.
     * @param forcedAspectRation Optional aspect ratio override for orthographic cameras.
     */
    syncCameras(source: Camera, target: Camera, orbitTarget?: Vector3, forcedAspectRation?: number | undefined): void;
    /**
     * Check if the overlay is indeed linked to Main canva.
     * @returns returns _isOverlayLinked boolean.
     */
    isOverlayLinked(): boolean;
    /**
     * Toggle the linking state between overlay and main controls.
     * just a signal to render() in index.ts to take the call for the sync
     */
    linkOverlayToMain(): void;
    /**
     * Synchronize the overlay camera with the main camera.
     * Creates new overlay controls that match the main camera type and position,
     * then adjusts the viewport to maintain proper aspect ratio.
     */
    syncOverlayFromMain(): void;
    /**
     * Adjust the aspect ratio of the overlay camera to match a new ratio.
     * @param ratio The new aspect ratio to apply to the overlay camera.
     */
    readaptOverlayAspectRatio(ratio: number): void;
    /**
     * Synchronize the overlay viewport with the given dimensions and ratios.
     * @param widthRatio The width scaling ratio to apply.
     * @param heightRatio The height scaling ratio to apply.
     * @param mitigateMotion Whether to compensate for camera movement during viewport changes.
     */
    syncOverlayViewPort(widthRatio: number, heightRatio: number, mitigateMotion?: boolean): void;
    /**
     * Internal method to synchronize viewport dimensions for a specific control.
     * Handles both orthographic and perspective cameras with optional motion mitigation.
     * @param control The orbit controls to modify.
     * @param widthRatio The width scaling ratio to apply.
     * @param heightRatio The height scaling ratio to apply.
     * @param overridenCanva The canvas element to use for aspect ratio calculations.
     * @param mitigateMotion Whether to adjust camera position to minimize apparent movement.
     */
    private syncViewPort;
    /**
     * Switch the roles of main and overlay controls.
     * Swaps the main camera controls with the overlay camera controls,
     * effectively making the overlay become the main view and vice versa.
     */
    switchContexts(): void;
    /**
     * Update orbit controls.
     * @param controls Orbit controls to be updated.
     */
    update(controls: OrbitControls): void;
    /**
     * Zoom all the cameras by a specific zoom factor.
     * The factor may either be greater or smaller.
     * @param zoomFactor The factor to zoom by.
     * @param zoomTime The time it takes for a zoom animation to complete.
     */
    zoomTo(zoomFactor: number, zoomTime: number): void;
    /**
     * Move the camera to look at the object with the given uuid.
     * @param uuid uuid of the object.
     * @param objectsGroup Group of objects to be traversed for finding the object
     * with the given uuid.
     */
    lookAtObject(uuid: string, objectsGroup: Object3D, offset?: number): void;
    /**
     * Get position of object from UUID.
     * @param uuid UUID of the object.
     * @param objectsGroup Objects group to look into for the object.
     * @returns Position of the 3D object.
     */
    getObjectPosition(uuid: string, objectsGroup: Object3D): Vector3;
    /**
     * Hide tube geometry of tracks on zoom if the camera is too close.
     * (For visibility of vertices)
     * @param scene Scene to look in for tracks.
     * @param minRadius Radius after which the tube tracks should be invisible.
     */
    hideTubeTracksOnZoom(scene: Scene, minRadius: number): void;
    /**
     * Check if the list of orbit controls contains a specific orbit controls.
     * @param obj Orbit controls to be checked for containment.
     * @param list List of orbit controls.
     * @returns If the list contains the orbit controls.
     */
    private containsObject;
    /**
     * Get the index of orbit controls from a list of orbit controls.
     * @param obj Orbit controls whose index is to be obtained.
     * @param list List of orbit controls.
     * @returns Index of the orbit controls in the given list. Returns -1 if not found.
     */
    private objectIndex;
    /**
     * Cleanup event listeners before re-initialization.
     */
    cleanup(): void;
}
