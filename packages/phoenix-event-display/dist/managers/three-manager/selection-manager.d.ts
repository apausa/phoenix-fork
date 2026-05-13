import { Scene, Object3D, Mesh } from 'three';
import { Group as TweenGroup } from '@tweenjs/tween.js';
import { InfoLogger } from '../../helpers/info-logger';
import { EffectsManager } from './effects-manager';
import { ActiveVariable } from '../../helpers/active-variable';
/**
 * Manager for managing event display's selection related functions.
 *
 * Features:
 * - Multi-object sticky selection with rainbow outlines
 * - Hover preview with blue outlines
 * - Click vs drag detection for orbit controls compatibility
 * - Performance-optimized frame-based intersection processing
 * - Programmatic selection API
 */
export declare class SelectionManager {
    /** Is initialized. */
    private isInit;
    /** Function to get the current controls. */
    private getControls;
    /** Function to get the current overlay controls (optional). */
    private getOverlayControls;
    /** Function to get the overlay canvas DOM element (optional). */
    private getOverlayCanvas;
    /** The scene used for event display. */
    private scene;
    /** Object used to display the information of the selected 3D object. */
    private selectedObject;
    /** The currently selected object which is observable for changes. */
    private activeObject;
    /** Objects to be ignored on hovering over the scene. */
    private ignoreList;
    /** Manager for managing three.js event display effects like outline pass and unreal bloom. */
    private effectsManager;
    /** Service for logging data to the information panel. */
    private infoLogger;
    /** Performance mode value before enabling selection. */
    private preSelectionAntialias;
    /** Latest mouse event to process */
    private latestMouseEvent;
    /** Currently outlined object for click detection */
    private currentlyOutlinedObject;
    /** Set of currently selected (sticky) objects */
    private selectedObjects;
    /** Currently hovered object (for outline preview) */
    private hoveredObject;
    /** The InstancedMesh currently being hovered */
    private hoveredInstanceMesh;
    /** The instanceId of the currently highlighted cell */
    private hoveredInstanceId;
    /** Original color of the highlighted cell (to restore on un-hover) */
    private hoveredInstanceOriginalColor;
    /** Highlight color for hovered instanced cells */
    private static readonly INSTANCE_HIGHLIGHT_COLOR;
    /** Mouse down position for drag detection (selection system) */
    private selectionMouseDownPosition;
    /** Maximum pixel distance to consider as a click (not drag) */
    private clickThreshold;
    /** Whether the user is currently dragging (selection system) */
    private selectionIsDragging;
    /** Timestamp of the last click for double-click detection */
    private lastClickTime;
    /** Maximum time between clicks to consider as double-click (ms) */
    private doubleClickThreshold;
    /** Position of the last click for double-click validation */
    private lastClickPosition;
    /** Mouse down position for passive double-click detection */
    private passiveMouseDownPosition;
    /** Frame counter for intersection processing */
    private frameCounter;
    /** Current number of frames to skip (dynamic) */
    private framesToSkip;
    /** Smoothed FPS for stable decisions */
    private smoothedFPS;
    /** FPS smoothing factor */
    private readonly FPS_SMOOTHING;
    /** Shared tween.js group for animations. */
    private tweenGroup;
    /** Performance thresholds for dynamic frame skipping to maintain stable FPS. */
    private readonly FPS_THRESHOLDS;
    /**
     * Constructor for the selection manager.
     */
    constructor();
    /**
     * Initialize the selection manager.
     *
     * Features enabled:
     * - Passive double-click detection on both main and overlay canvases
     * - Smooth Tween.js-based orbit target transitions
     * - Automatic canvas detection and appropriate controls routing
     * - Detailed collision information logging
     *
     * @param getControls Function to get the current main controls.
     * @param getOverlayControls Function to get the current overlay controls (optional).
     * @param getOverlayCanvas Function to get the overlay canvas DOM element (optional).
     * @param scene The scene used for event display.
     * @param effectsManager Manager for managing three.js event display effects
     * like outline pass and unreal bloom.
     * @param infoLogger Service for logging data to the information panel.
     */
    init(getControls: () => any, getOverlayControls: (() => any) | undefined, getOverlayCanvas: (() => HTMLCanvasElement | undefined) | undefined, scene: Scene, effectsManager: EffectsManager, infoLogger: InfoLogger, tweenGroup?: TweenGroup): void;
    /**
     * Set the currently selected object.
     * @param selectedObject The currently selected object.
     */
    setSelectedObject(selectedObject: {
        name: string;
        attributes: any[];
    }): void;
    /**
     * Get the uuid of the currently selected object.
     * @returns uuid of the currently selected object.
     */
    getActiveObjectId(): ActiveVariable<string>;
    /**
     * Set if selecting is to be enabled or disabled.
     * @param enable If selecting is to be enabled or disabled.
     */
    setSelecting(enable: boolean): void;
    /**
     * Enable passive double-click detection (always active, independent of selection).
     * Sets up event listeners for both main and overlay canvases.
     * This method can be called multiple times safely due to listener deduplication.
     */
    private enablePassiveDoubleClick;
    /**
     * Set up event listeners for overlay canvas if it exists.
     * This method can be called multiple times safely.
     */
    private setupOverlayListeners;
    /**
     * Disable passive double-click detection for both canvases.
     */
    private disablePassiveDoubleClick;
    /**
     * Passive mouse down handler for double-click detection only.
     */
    private onPassiveMouseDown;
    /**
     * Passive mouse up handler for double-click detection only.
     */
    private onPassiveMouseUp;
    /**
     * Handle passive double-click events (works independently of selection state).
     * Automatically determines which canvas/controls to use based on the event target.
     * @param event The mouse event for collision detection
     */
    private handlePassiveDoubleClick;
    /**
     * Enable selecting of event display elements and set mouse move and click events.
     */
    private enableSelecting;
    /**
     * Disable selecting of event display elements and remove mouse move and click events.
     */
    private disableSelecting;
    /**
     * Function to call on mouse move when object selection is enabled.
     * Stacks events and only processes the latest one every few frames.
     * Also tracks dragging for click vs drag detection.
     */
    private onTouchMove;
    /**
     * Apply intersection result to selection outline using custom outline system.
     * Now handles both hover outlines and sticky selections.
     * Skips hover updates during drag operations to avoid visual noise.
     */
    applyIntersectionResult(intersectedObject: Object3D | null): void;
    /**
     * Highlight an individual instance in an InstancedMesh by changing its color.
     * Saves the original color so it can be restored on un-hover.
     */
    private setInstanceHighlight;
    /**
     * Restore the original color of a previously highlighted instanced cell.
     */
    private clearInstanceHighlight;
    /**
     * Function to call on mouse down to start drag detection.
     */
    private onMouseDown;
    /**
     * Function to call on mouse up to detect clicks vs drags and double-clicks.
     * Only triggers selection if the mouse hasn't moved significantly (not a drag).
     * Detects double-clicks for collision coordinate display.
     */
    private onMouseUp;
    /**
     * Function to call on mouse click when object selection is enabled.
     * Implements sticky multi-selection behavior:
     * - Click on object: toggle its selection (add if not selected, remove if selected)
     * - Click on empty space: clear all selections
     */
    private handleClick;
    /**
     * Update the info panel for a hovered object (hover-only info display).
     * @param object The object being hovered, or null to clear
     */
    private updateInfoPanelForHover;
    /**
     * Log a selection/deselection action without updating the info panel.
     * @param object The object that was selected/deselected
     * @param isSelected Whether the object is now selected
     */
    private logSelectionAction;
    /**
     * Update the info panel for a selected/deselected object.
     * @param object The object that was clicked
     * @param isSelected Whether the object is now selected
     */
    private updateInfoPanel;
    /**
     * Function to call on touch when object selection is enabled.
     * @param event Event containing touch data.
     */
    private onTouchDown;
    /**
     * Perform intersection calculation with the scene objects.
     * @param event Mouse event containing coordinates
     * @returns The intersected object or null
     */
    private intersectObject;
    /**
     * Perform detailed intersection calculation with complete collision information.
     * @param event Mouse event containing coordinates
     * @returns Detailed intersection data or null
     */
    private getDetailedIntersection;
    /**
     * Enable highlighting of the objects.
     */
    enableHighlighting(): void;
    /**
     * Highlight the object with the given uuid by selecting it.
     * @param uuid uuid of the object.
     * @param objectsGroup Group of objects to be traversed for finding the object
     * with the given uuid.
     */
    highlightObject(uuid: string, objectsGroup: Object3D): void;
    /**
     * Disable highlighting of objects.
     */
    disableHighlighting(): void;
    /**
     * Process intersection only when there's a new mouse event to process.
     * This should be called once per render frame but only processes when mouse moves.
     */
    processStackedIntersection(deltaTime: number): void;
    /**
     * Adjust frame skipping based on FPS with hysteresis to prevent oscillation.
     */
    private adjustFrameSkipping;
    /**
     * Get all currently selected objects.
     * @returns Set of selected mesh objects
     */
    getSelectedObjects(): Set<Mesh>;
    /**
     * Get the currently hovered object (if any).
     * @returns The hovered mesh object or null
     */
    getHoveredObject(): Mesh | null;
    /**
     * Check if a specific object is currently selected.
     * @param object The object to check
     * @returns True if the object is selected
     */
    isSelected(object: Mesh): boolean;
    /**
     * Programmatically select an object (without triggering click events).
     * @param object The object to select
     * @returns True if the object was selected, false if already selected
     */
    selectObject(object: Mesh): boolean;
    /**
     * Programmatically deselect an object (without triggering click events).
     * @param object The object to deselect
     * @returns True if the object was deselected, false if not selected
     */
    deselectObject(object: Mesh): boolean;
    /**
     * Programmatically toggle selection of an object.
     * @param object The object to toggle
     * @returns True if the object is now selected, false if deselected
     */
    toggleObjectSelection(object: Mesh): boolean;
    /**
     * Programmatically clear all selections and reset internal state.
     * This method is called when event data is cleared to prevent stale references.
     */
    clearAllSelections(): void;
    /**
     * Set the click threshold for drag detection.
     * @param threshold Maximum pixel distance to consider as a click (not drag)
     */
    setClickThreshold(threshold: number): void;
    /**
     * Get the current click threshold.
     * @returns Current click threshold in pixels
     */
    getClickThreshold(): number;
    /**
     * Set the double-click time threshold.
     * @param threshold Maximum time between clicks to consider as double-click (ms)
     */
    setDoubleClickThreshold(threshold: number): void;
    /**
     * Get the current double-click time threshold.
     * @returns Current double-click threshold in milliseconds
     */
    getDoubleClickThreshold(): number;
    /**
     * Update overlay event listeners when overlay canvas becomes available.
     * Called by ThreeManager when setOverlayRenderer is invoked.
     */
    updateOverlayListeners(): void;
    /**
     * Determine if a mouse event came from the overlay canvas.
     * @param event The mouse event to check
     * @returns true if the event came from the overlay canvas, false if from main canvas
     */
    private isEventFromOverlayCanvas;
    /**
     * Cleanup all event listeners and resources before re-initialization.
     * Must be called before destroying the SelectionManager or re-initializing.
     */
    cleanup(): void;
}
