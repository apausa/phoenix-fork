import { Vector2, Raycaster, DirectionalLight, AmbientLight, AxesHelper, Mesh, InstancedMesh, Color, } from 'three';
import { Easing, Group as TweenGroup, Tween } from '@tweenjs/tween.js';
import { PrettySymbols } from '../../helpers/pretty-symbols';
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
export class SelectionManager {
    /**
     * Constructor for the selection manager.
     */
    constructor() {
        /** The currently selected object which is observable for changes. */
        this.activeObject = new ActiveVariable('');
        // Frame-based intersection processing with dynamic adjustment
        /** Latest mouse event to process */
        this.latestMouseEvent = null;
        /** Currently outlined object for click detection */
        this.currentlyOutlinedObject = null;
        // Multi-selection system
        /** Set of currently selected (sticky) objects */
        this.selectedObjects = new Set();
        /** Currently hovered object (for outline preview) */
        this.hoveredObject = null;
        // InstancedMesh per-cell hover highlight (CaloCells)
        /** The InstancedMesh currently being hovered */
        this.hoveredInstanceMesh = null;
        /** The instanceId of the currently highlighted cell */
        this.hoveredInstanceId = null;
        /** Original color of the highlighted cell (to restore on un-hover) */
        this.hoveredInstanceOriginalColor = null;
        // Drag detection to prevent accidental selection during orbit controls
        /** Mouse down position for drag detection (selection system) */
        this.selectionMouseDownPosition = null;
        /** Maximum pixel distance to consider as a click (not drag) */
        this.clickThreshold = 10;
        /** Whether the user is currently dragging (selection system) */
        this.selectionIsDragging = false;
        // Double-click detection for collision coordinates
        /** Timestamp of the last click for double-click detection */
        this.lastClickTime = 0;
        /** Maximum time between clicks to consider as double-click (ms) */
        this.doubleClickThreshold = 300;
        /** Position of the last click for double-click validation */
        this.lastClickPosition = null;
        /** Mouse down position for passive double-click detection */
        this.passiveMouseDownPosition = null;
        /** Frame counter for intersection processing */
        this.frameCounter = 0;
        /** Current number of frames to skip (dynamic) */
        this.framesToSkip = 3;
        /** Smoothed FPS for stable decisions */
        this.smoothedFPS = 60;
        /** FPS smoothing factor */
        this.FPS_SMOOTHING = 0.1;
        // Hysteresis thresholds to prevent oscillation
        /** Performance thresholds for dynamic frame skipping to maintain stable FPS. */
        this.FPS_THRESHOLDS = {
            // Going to more aggressive skipping (when performance drops)
            TO_HIGH_SKIP: 25, // FPS drops below 25 → skip 8 frames
            TO_MED_SKIP: 35, // FPS drops below 35 → skip 5 frames
            // Going to less aggressive skipping (when performance improves)
            TO_LOW_SKIP: 45, // FPS above 45 → skip 3 frames
            TO_MINIMAL_SKIP: 90, // FPS above 55 → skip 1 frame
        };
        /**
         * Passive mouse down handler for double-click detection only.
         */
        this.onPassiveMouseDown = (event) => {
            // Only track for double-click detection, don't interfere with selection
            // Using different variable names to avoid conflicts with selection system
            this.passiveMouseDownPosition = { x: event.clientX, y: event.clientY };
        };
        /**
         * Passive mouse up handler for double-click detection only.
         */
        this.onPassiveMouseUp = (event) => {
            if (!this.passiveMouseDownPosition) {
                return;
            }
            // Calculate distance moved (same logic as selection)
            const deltaX = event.clientX - this.passiveMouseDownPosition.x;
            const deltaY = event.clientY - this.passiveMouseDownPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            // Only process if it's a click (not a drag)
            if (distance <= this.clickThreshold) {
                // Check for double-click
                const currentTime = Date.now();
                const timeDelta = currentTime - this.lastClickTime;
                const clickPosition = { x: event.clientX, y: event.clientY };
                let isDoubleClick = false;
                if (this.lastClickPosition && timeDelta <= this.doubleClickThreshold) {
                    const positionDelta = Math.sqrt(Math.pow(clickPosition.x - this.lastClickPosition.x, 2) +
                        Math.pow(clickPosition.y - this.lastClickPosition.y, 2));
                    if (positionDelta <= this.clickThreshold) {
                        isDoubleClick = true;
                    }
                }
                if (isDoubleClick) {
                    // Handle double-click without triggering selection
                    this.handlePassiveDoubleClick(event);
                }
                // Update last click tracking
                this.lastClickTime = currentTime;
                this.lastClickPosition = clickPosition;
            }
            // Reset mouse down position
            this.passiveMouseDownPosition = null;
        };
        /**
         * Handle passive double-click events (works independently of selection state).
         * Automatically determines which canvas/controls to use based on the event target.
         * @param event The mouse event for collision detection
         */
        this.handlePassiveDoubleClick = (event) => {
            // Determine which canvas the event came from
            const isOverlayCanvas = this.isEventFromOverlayCanvas(event);
            const canvasType = isOverlayCanvas ? 'Overlay' : 'Main';
            console.log(`=== DOUBLE-CLICK ON ${canvasType.toUpperCase()} CANVAS ===`);
            const collision = this.getDetailedIntersection(event, isOverlayCanvas);
            if (collision) {
                const { object, point, face, faceIndex, uv } = collision;
                // Print detailed collision information
                console.log('=== DOUBLE-CLICK COLLISION DETECTED ===');
                console.log('Canvas:', canvasType);
                console.log('Object:', object.name || 'unnamed');
                console.log('Object UUID:', object.uuid);
                console.log('Collision Point (World):', {
                    x: point.x.toFixed(4),
                    y: point.y.toFixed(4),
                    z: point.z.toFixed(4),
                });
                if (face) {
                    console.log('Face Index:', faceIndex);
                    console.log('Face Normal:', {
                        x: face.normal.x.toFixed(4),
                        y: face.normal.y.toFixed(4),
                        z: face.normal.z.toFixed(4),
                    });
                }
                if (uv) {
                    console.log('UV Coordinates:', {
                        u: uv.x.toFixed(4),
                        v: uv.y.toFixed(4),
                    });
                }
                console.log('Distance from Camera:', collision.distance.toFixed(4));
                console.log('=====================================');
                // Smoothly animate orbit target to the collision point using appropriate controls
                const controls = isOverlayCanvas
                    ? this.getOverlayControls?.()
                    : this.getControls();
                const controlsType = isOverlayCanvas ? 'overlay' : 'main';
                console.log(`Using ${controlsType} controls for orbit target animation`);
                console.log('Controls object:', controls);
                console.log('Controls.object (camera):', controls?.object);
                if (controls && controls.target) {
                    // Store current target position for animation
                    const currentTarget = {
                        x: controls.target.x,
                        y: controls.target.y,
                        z: controls.target.z,
                    };
                    // Create tween for smooth transition
                    const targetTween = new Tween(currentTarget, this.tweenGroup)
                        .to({
                        x: point.x,
                        y: point.y,
                        z: point.z,
                    }, 1000) // 1 second duration
                        .easing(Easing.Cubic.Out) // Smooth easing
                        .onUpdate(() => {
                        // Update controls target during animation
                        controls.target.set(currentTarget.x, currentTarget.y, currentTarget.z);
                        controls.update();
                    })
                        .onComplete(() => {
                        // Ensure final position is exact
                        controls.target.copy(point);
                        controls.update();
                        console.log(`${controlsType} orbit target smoothly animated to collision point`);
                    });
                    // Start the animation
                    targetTween.start();
                    console.log('Starting smooth orbit target animation');
                }
                else {
                    console.warn(`${controlsType} controls or controls.target not available for orbit target update`);
                }
                // Also log to the info logger for UI feedback
                this.infoLogger.add(`[${canvasType}] Collision at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}) on ${object.name || 'unnamed'} - Smoothly animating ${controlsType} orbit target`, 'Double-Click');
            }
            else {
                console.log(`Double-click detected on ${canvasType} canvas but no collision found`);
                this.infoLogger.add(`[${canvasType}] Double-click detected (no collision)`, 'Double-Click');
            }
        };
        /**
         * Function to call on mouse move when object selection is enabled.
         * Stacks events and only processes the latest one every few frames.
         * Also tracks dragging for click vs drag detection.
         */
        this.onTouchMove = (event) => {
            // Stack the latest mouse event - this will replace any previous unstacked event
            this.latestMouseEvent = event;
            // Check if this is a drag operation
            if (this.selectionMouseDownPosition && !this.selectionIsDragging) {
                const deltaX = event.clientX - this.selectionMouseDownPosition.x;
                const deltaY = event.clientY - this.selectionMouseDownPosition.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > this.clickThreshold) {
                    this.selectionIsDragging = true;
                    // Clear hover outline when drag starts to provide immediate visual feedback
                    this.effectsManager.setHoverOutline(null);
                    this.hoveredObject = null;
                    this.currentlyOutlinedObject = null;
                }
            }
        };
        /**
         * Function to call on mouse down to start drag detection.
         */
        this.onMouseDown = (event) => {
            this.selectionMouseDownPosition = { x: event.clientX, y: event.clientY };
            this.selectionIsDragging = false;
        };
        /**
         * Function to call on mouse up to detect clicks vs drags and double-clicks.
         * Only triggers selection if the mouse hasn't moved significantly (not a drag).
         * Detects double-clicks for collision coordinate display.
         */
        this.onMouseUp = (event) => {
            if (!this.selectionMouseDownPosition) {
                return; // No mousedown recorded
            }
            // Calculate distance moved
            const deltaX = event.clientX - this.selectionMouseDownPosition.x;
            const deltaY = event.clientY - this.selectionMouseDownPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            // Reset drag detection
            this.selectionMouseDownPosition = null;
            this.selectionIsDragging = false;
            // Only process as a click if movement was minimal (not a drag)
            if (distance <= this.clickThreshold) {
                this.handleClick(event);
            }
        };
        /**
         * Function to call on mouse click when object selection is enabled.
         * Implements sticky multi-selection behavior:
         * - Click on object: toggle its selection (add if not selected, remove if selected)
         * - Click on empty space: clear all selections
         */
        this.handleClick = (event) => {
            // Use pre-computed hover target, or do a fresh raycast if needed
            let intersectedObject = this.currentlyOutlinedObject;
            if (!intersectedObject && event) {
                const result = this.intersectObject(event);
                if (result && result instanceof Mesh) {
                    intersectedObject = result;
                }
            }
            if (intersectedObject) {
                // Toggle selection of the clicked object
                const wasSelected = this.selectedObjects.has(intersectedObject);
                const isNowSelected = this.effectsManager.toggleSelection(intersectedObject);
                if (isNowSelected) {
                    this.selectedObjects.add(intersectedObject);
                }
                else {
                    this.selectedObjects.delete(intersectedObject);
                }
                // Log the selection/deselection (no info panel update)
                this.logSelectionAction(intersectedObject, isNowSelected);
            }
            else {
                // Clicked on empty space - clear all selections
                if (this.selectedObjects.size > 0) {
                    this.effectsManager.clearAllSelections();
                    this.selectedObjects.clear();
                    // Log that selections were cleared
                    this.infoLogger.add('All selections cleared', 'Selection');
                }
            }
        };
        /**
         * Function to call on touch when object selection is enabled.
         * @param event Event containing touch data.
         */
        this.onTouchDown = (event) => {
            event.preventDefault();
            this.onTouchMove(event.targetTouches[0]);
            // For touch, we treat it as an immediate click (no drag detection for now)
            this.handleClick();
        };
        this.isInit = false;
        this.ignoreList = [
            new AmbientLight().type,
            new DirectionalLight().type,
            new AxesHelper().type,
        ];
    }
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
    init(getControls, getOverlayControls, getOverlayCanvas, scene, effectsManager, infoLogger, tweenGroup = new TweenGroup()) {
        this.getControls = getControls;
        this.getOverlayControls = getOverlayControls;
        this.getOverlayCanvas = getOverlayCanvas;
        this.scene = scene;
        this.isInit = true;
        this.infoLogger = infoLogger;
        this.effectsManager = effectsManager;
        this.tweenGroup = tweenGroup;
        // Custom outline system is now used instead of OutlinePass
        // Always enable passive double-click detection for both canvases
        this.enablePassiveDoubleClick();
    }
    /**
     * Set the currently selected object.
     * @param selectedObject The currently selected object.
     */
    setSelectedObject(selectedObject) {
        this.selectedObject = selectedObject;
    }
    /**
     * Get the uuid of the currently selected object.
     * @returns uuid of the currently selected object.
     */
    getActiveObjectId() {
        return this.activeObject;
    }
    /**
     * Set if selecting is to be enabled or disabled.
     * @param enable If selecting is to be enabled or disabled.
     */
    setSelecting(enable) {
        if (this.isInit) {
            // eslint-disable-next-line
            enable ? this.enableSelecting() : this.disableSelecting();
        }
    }
    /**
     * Enable passive double-click detection (always active, independent of selection).
     * Sets up event listeners for both main and overlay canvases.
     * This method can be called multiple times safely due to listener deduplication.
     */
    enablePassiveDoubleClick() {
        // Main canvas (always available)
        const mainCanvas = document.getElementById('three-canvas');
        if (mainCanvas) {
            // Remove existing listeners to avoid duplicates on re-initialization
            mainCanvas.removeEventListener('mousedown', this.onPassiveMouseDown, true);
            mainCanvas.removeEventListener('mouseup', this.onPassiveMouseUp, true);
            // Add listeners
            mainCanvas.addEventListener('mousedown', this.onPassiveMouseDown, true);
            mainCanvas.addEventListener('mouseup', this.onPassiveMouseUp, true);
        }
        // Overlay canvas (available when overlay is created)
        this.setupOverlayListeners();
    }
    /**
     * Set up event listeners for overlay canvas if it exists.
     * This method can be called multiple times safely.
     */
    setupOverlayListeners() {
        if (this.getOverlayCanvas) {
            const overlayCanvas = this.getOverlayCanvas();
            if (overlayCanvas) {
                // Remove existing listeners to avoid duplicates
                overlayCanvas.removeEventListener('mousedown', this.onPassiveMouseDown, true);
                overlayCanvas.removeEventListener('mouseup', this.onPassiveMouseUp, true);
                // Add new listeners
                overlayCanvas.addEventListener('mousedown', this.onPassiveMouseDown, true);
                overlayCanvas.addEventListener('mouseup', this.onPassiveMouseUp, true);
            }
        }
    }
    /**
     * Disable passive double-click detection for both canvases.
     */
    disablePassiveDoubleClick() {
        // Main canvas
        const mainCanvas = document.getElementById('three-canvas');
        if (mainCanvas) {
            mainCanvas.removeEventListener('mousedown', this.onPassiveMouseDown, true);
            mainCanvas.removeEventListener('mouseup', this.onPassiveMouseUp, true);
        }
        // Overlay canvas
        if (this.getOverlayCanvas) {
            const overlayCanvas = this.getOverlayCanvas();
            if (overlayCanvas) {
                overlayCanvas.removeEventListener('mousedown', this.onPassiveMouseDown, true);
                overlayCanvas.removeEventListener('mouseup', this.onPassiveMouseUp, true);
            }
        }
        // Reset double-click state
        this.lastClickTime = 0;
        this.lastClickPosition = null;
        this.passiveMouseDownPosition = null;
    }
    /**
     * Enable selecting of event display elements and set mouse move and click events.
     */
    enableSelecting() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas) {
            return;
        }
        canvas.addEventListener('mousemove', this.onTouchMove, true);
        canvas.addEventListener('mousedown', this.onMouseDown, true);
        canvas.addEventListener('mouseup', this.onMouseUp, true);
        canvas.addEventListener('touchstart', this.onTouchDown);
        this.preSelectionAntialias = this.effectsManager.antialiasing;
        this.effectsManager.setAntialiasing(false);
    }
    /**
     * Disable selecting of event display elements and remove mouse move and click events.
     */
    disableSelecting() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas) {
            return;
        }
        canvas.removeEventListener('mousemove', this.onTouchMove, true);
        canvas.removeEventListener('mousedown', this.onMouseDown, true);
        canvas.removeEventListener('mouseup', this.onMouseUp, true);
        canvas.removeEventListener('touchstart', this.onTouchDown);
        // Clean up frame-based processing
        this.latestMouseEvent = null;
        this.frameCounter = 0;
        this.framesToSkip = 3; // Reset to default
        this.smoothedFPS = 60;
        // Clean up drag detection
        this.selectionMouseDownPosition = null;
        this.selectionIsDragging = false;
        // Clear all outlines and selections
        this.effectsManager.clearAllSelections();
        this.effectsManager.setHoverOutline(null);
        this.selectedObjects.clear();
        this.hoveredObject = null;
        this.currentlyOutlinedObject = null;
        this.effectsManager.setAntialiasing(this.preSelectionAntialias);
    }
    /**
     * Apply intersection result to selection outline using custom outline system.
     * Now handles both hover outlines and sticky selections.
     * Skips hover updates during drag operations to avoid visual noise.
     */
    applyIntersectionResult(intersectedObject) {
        // Skip hover outline updates during drag operations
        if (this.selectionIsDragging) {
            return;
        }
        let targetObject = null;
        if (intersectedObject) {
            if (!this.ignoreList.includes(intersectedObject.type) &&
                intersectedObject instanceof Mesh) {
                targetObject = intersectedObject;
            }
        }
        // For InstancedMesh, compare instanceId too (different cells = same object)
        const isInstanced = targetObject?.userData?._isInstancedCaloCells;
        const instanceId = isInstanced
            ? (targetObject.userData._lastHitInstanceId ?? null)
            : null;
        const hoverChanged = isInstanced
            ? targetObject !== this.hoveredObject ||
                instanceId !== this.hoveredInstanceId
            : targetObject !== this.hoveredObject;
        if (hoverChanged) {
            // Restore any previous instanced cell highlight before switching
            this.clearInstanceHighlight();
            this.hoveredObject = targetObject;
            if (isInstanced && instanceId !== null) {
                // Highlight the hovered cell via color change
                this.setInstanceHighlight(targetObject, instanceId);
                this.effectsManager.setHoverOutline(null);
                this.updateInfoPanelForHover(targetObject);
                this.currentlyOutlinedObject = null;
                return;
            }
            // Non-instanced: normal outline
            this.effectsManager.setHoverOutline(targetObject);
            // Update info panel for hovered object (immediate feedback)
            this.updateInfoPanelForHover(targetObject);
            // Also update the currently outlined object for backwards compatibility
            this.currentlyOutlinedObject = targetObject;
        }
    }
    /**
     * Highlight an individual instance in an InstancedMesh by changing its color.
     * Saves the original color so it can be restored on un-hover.
     */
    setInstanceHighlight(mesh, instanceId) {
        if (!mesh.instanceColor)
            return;
        const origColor = new Color();
        mesh.getColorAt(instanceId, origColor);
        this.hoveredInstanceMesh = mesh;
        this.hoveredInstanceId = instanceId;
        this.hoveredInstanceOriginalColor = origColor;
        mesh.setColorAt(instanceId, SelectionManager.INSTANCE_HIGHLIGHT_COLOR);
        mesh.instanceColor.needsUpdate = true;
    }
    /**
     * Restore the original color of a previously highlighted instanced cell.
     */
    clearInstanceHighlight() {
        if (this.hoveredInstanceMesh &&
            this.hoveredInstanceId !== null &&
            this.hoveredInstanceOriginalColor &&
            this.hoveredInstanceMesh.instanceColor) {
            this.hoveredInstanceMesh.setColorAt(this.hoveredInstanceId, this.hoveredInstanceOriginalColor);
            this.hoveredInstanceMesh.instanceColor.needsUpdate = true;
        }
        this.hoveredInstanceMesh = null;
        this.hoveredInstanceId = null;
        this.hoveredInstanceOriginalColor = null;
    }
    /**
     * Update the info panel for a hovered object (hover-only info display).
     * @param object The object being hovered, or null to clear
     */
    updateInfoPanelForHover(object) {
        if (object) {
            // InstancedMesh CaloCells: read per-instance data
            let userData = object.userData;
            if (userData?._isInstancedCaloCells &&
                userData._instanceData &&
                userData._lastHitInstanceId !== undefined) {
                userData = userData._instanceData[userData._lastHitInstanceId] ?? {};
            }
            // Object is being hovered - update info panel
            this.selectedObject.name = object.name;
            this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);
            this.activeObject.update(object.uuid);
            const prettyParams = PrettySymbols.getPrettyParams(userData);
            for (const key of Object.keys(prettyParams)) {
                this.selectedObject.attributes.push({
                    attributeName: key,
                    attributeValue: prettyParams[key],
                });
            }
        }
        else {
            // No object being hovered - clear info panel
            this.selectedObject.name = '';
            this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);
            this.activeObject.update('');
        }
    }
    /**
     * Log a selection/deselection action without updating the info panel.
     * @param object The object that was selected/deselected
     * @param isSelected Whether the object is now selected
     */
    logSelectionAction(object, isSelected) {
        // Process properties of the object for logging
        const props = Object.keys(object.userData)
            .map((key) => {
            // Only take properties that are a string or number (no arrays or objects)
            if (['string', 'number'].includes(typeof object.userData[key])) {
                return key + '=' + object.userData[key];
            }
        })
            .filter((val) => val);
        // Build the log text and add to the logger
        const log = object.name + (props.length > 0 ? ' with ' + props.join(', ') : '');
        if (isSelected) {
            this.infoLogger.add(log || 'unnamed object', 'Selected');
        }
        else {
            this.infoLogger.add(log || 'unnamed object', 'Deselected');
        }
    }
    /**
     * Update the info panel for a selected/deselected object.
     * @param object The object that was clicked
     * @param isSelected Whether the object is now selected
     */
    updateInfoPanel(object, isSelected) {
        if (isSelected) {
            // Object was selected - update info panel
            this.selectedObject.name = object.name;
            this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);
            this.activeObject.update(object.uuid);
            const prettyParams = PrettySymbols.getPrettyParams(object.userData);
            for (const key of Object.keys(prettyParams)) {
                this.selectedObject.attributes.push({
                    attributeName: key,
                    attributeValue: prettyParams[key],
                });
            }
            // Process properties of the selected object
            const props = Object.keys(object.userData)
                .map((key) => {
                // Only take properties that are a string or number (no arrays or objects)
                if (['string', 'number'].includes(typeof object.userData[key])) {
                    return key + '=' + object.userData[key];
                }
            })
                .filter((val) => val);
            // Build the log text and add to the logger
            const log = object.name + (props.length > 0 ? ' with ' + props.join(', ') : '');
            if (log) {
                this.infoLogger.add(log, 'Selected');
            }
        }
        else {
            // Object was deselected
            const log = object.name || 'unnamed object';
            this.infoLogger.add(log, 'Deselected');
            // If this was the active object, clear the info panel
            if (this.activeObject.value === object.uuid) {
                this.selectedObject.name = '';
                this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);
                this.activeObject.update('');
            }
        }
    }
    /**
     * Perform intersection calculation with the scene objects.
     * @param event Mouse event containing coordinates
     * @returns The intersected object or null
     */
    intersectObject(event) {
        const mouse = new Vector2();
        const raycaster = new Raycaster();
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rendererElement = this.effectsManager.composer.renderer.domElement;
        mouse.x = (event.clientX / rendererElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / rendererElement.clientHeight) * 2 + 1;
        // Set up raycaster
        const controls = this.getControls();
        const camera = controls?.object;
        if (!camera) {
            console.warn('SelectionManager: Camera not available from controls in intersectObject');
            return null;
        }
        raycaster.setFromCamera(mouse, camera);
        // Get all intersectable objects from the scene
        const intersectableObjects = [];
        this.scene.traverse((obj) => {
            // Skip objects in ignore list
            if (this.ignoreList.includes(obj.type))
                return;
            // Only include objects with geometry that are visible
            if (obj.geometry && obj.visible) {
                intersectableObjects.push(obj);
            }
        });
        // Perform intersection test
        const intersects = raycaster.intersectObjects(intersectableObjects, false);
        if (intersects.length === 0)
            return null;
        const hit = intersects[0];
        // For InstancedMesh CaloCells, store the hit instanceId for downstream use
        if (hit.object.userData?._isInstancedCaloCells &&
            hit.object instanceof InstancedMesh &&
            hit.instanceId !== undefined) {
            hit.object.userData._lastHitInstanceId = hit.instanceId;
        }
        return hit.object;
    }
    /**
     * Perform detailed intersection calculation with complete collision information.
     * @param event Mouse event containing coordinates
     * @returns Detailed intersection data or null
     */
    getDetailedIntersection(event, useOverlay = false) {
        const mouse = new Vector2();
        const raycaster = new Raycaster();
        // Get the appropriate controls and renderer based on canvas type
        let controls;
        let rendererElement;
        if (useOverlay && this.getOverlayControls) {
            controls = this.getOverlayControls();
            const overlayCanvas = this.getOverlayCanvas?.();
            if (!controls || !overlayCanvas) {
                console.warn('SelectionManager: Overlay controls or canvas not available');
                return null;
            }
            rendererElement = overlayCanvas;
        }
        else {
            controls = this.getControls();
            rendererElement = this.effectsManager.composer.renderer.domElement;
        }
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / rendererElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / rendererElement.clientHeight) * 2 + 1;
        // Set up raycaster
        const camera = controls?.object;
        if (!camera) {
            const canvasType = useOverlay ? 'overlay' : 'main';
            console.warn(`SelectionManager: Camera not available from ${canvasType} controls in getDetailedIntersection`);
            return null;
        }
        raycaster.setFromCamera(mouse, camera);
        // Get all intersectable objects from the scene
        const intersectableObjects = [];
        this.scene.traverse((obj) => {
            // Skip objects in ignore list
            if (this.ignoreList.includes(obj.type))
                return;
            // Only include objects with geometry that are visible
            if (obj.geometry && obj.visible) {
                intersectableObjects.push(obj);
            }
        });
        // Perform intersection test with detailed results
        const intersects = raycaster.intersectObjects(intersectableObjects, false);
        if (intersects.length > 0) {
            const intersection = intersects[0];
            // Return detailed collision information
            return {
                object: intersection.object,
                point: intersection.point,
                face: intersection.face || null,
                faceIndex: intersection.faceIndex || -1,
                distance: intersection.distance,
                uv: intersection.uv,
            };
        }
        return null;
    }
    /**
     * Enable highlighting of the objects.
     */
    enableHighlighting() {
        this.preSelectionAntialias = this.effectsManager.antialiasing;
        this.effectsManager.setAntialiasing(false);
    }
    /**
     * Highlight the object with the given uuid by selecting it.
     * @param uuid uuid of the object.
     * @param objectsGroup Group of objects to be traversed for finding the object
     * with the given uuid.
     */
    highlightObject(uuid, objectsGroup) {
        const object = objectsGroup.getObjectByProperty('uuid', uuid);
        if (object && object instanceof Mesh) {
            // Skip OutlinePass for instanced CaloCells (can't outline individual instances)
            if (object.userData?._isInstancedCaloCells)
                return;
            // Use the modern selection system instead of legacy outline
            this.effectsManager.selectObject(object);
            this.selectedObjects.add(object);
            this.currentlyOutlinedObject = object;
            // Note: No info panel update - info panel is now hover-only
            this.logSelectionAction(object, true);
        }
    }
    /**
     * Disable highlighting of objects.
     */
    disableHighlighting() {
        // Clear all selections instead of just the legacy outline
        this.clearInstanceHighlight();
        this.effectsManager.clearAllSelections();
        this.selectedObjects.clear();
        this.currentlyOutlinedObject = null;
        this.effectsManager.setAntialiasing(this.preSelectionAntialias);
        // Note: No info panel clearing - info panel is now hover-controlled
        this.infoLogger.add('All selections cleared', 'Selection');
    }
    /**
     * Process intersection only when there's a new mouse event to process.
     * This should be called once per render frame but only processes when mouse moves.
     */
    processStackedIntersection(deltaTime) {
        // Only process if we have a new mouse event
        if (!this.latestMouseEvent) {
            return; // No mouse event to process
        }
        // Calculate and smooth FPS
        const currentFPS = 1000 / deltaTime; // deltaTime in ms
        this.smoothedFPS =
            this.smoothedFPS * (1 - this.FPS_SMOOTHING) +
                currentFPS * this.FPS_SMOOTHING;
        // Adjust frame skipping based on smoothed FPS using hysteresis
        this.adjustFrameSkipping();
        this.frameCounter++;
        // Only process intersection every framesToSkip frames
        if (this.frameCounter >= this.framesToSkip) {
            this.frameCounter = 0; // Reset counter
            // Process the latest stacked mouse event
            const result = this.intersectObject(this.latestMouseEvent);
            this.applyIntersectionResult(result);
            // Clear the processed event to avoid reprocessing
            this.latestMouseEvent = null;
        }
    }
    /**
     * Adjust frame skipping based on FPS with hysteresis to prevent oscillation.
     */
    adjustFrameSkipping() {
        const fps = this.smoothedFPS;
        const currentSkip = this.framesToSkip;
        let newSkip = currentSkip;
        // Determine new skip value based on FPS thresholds and current state
        if (fps < this.FPS_THRESHOLDS.TO_HIGH_SKIP && currentSkip < 8) {
            newSkip = 8; // Aggressive skipping for very low FPS
        }
        else if (fps < this.FPS_THRESHOLDS.TO_MED_SKIP && currentSkip < 5) {
            newSkip = 5; // Moderate skipping for low FPS
        }
        else if (fps > this.FPS_THRESHOLDS.TO_MINIMAL_SKIP && currentSkip > 1) {
            newSkip = 1; // Minimal skipping for high FPS
        }
        else if (fps > this.FPS_THRESHOLDS.TO_LOW_SKIP && currentSkip > 3) {
            newSkip = 3; // Low skipping for medium-good FPS
        }
        // Only change if it's different and log the decision
        if (newSkip !== currentSkip) {
            this.framesToSkip = newSkip;
        }
    }
    // Public methods for programmatic access to selection state
    /**
     * Get all currently selected objects.
     * @returns Set of selected mesh objects
     */
    getSelectedObjects() {
        return new Set(this.selectedObjects); // Return a copy to prevent external modification
    }
    /**
     * Get the currently hovered object (if any).
     * @returns The hovered mesh object or null
     */
    getHoveredObject() {
        return this.hoveredObject;
    }
    /**
     * Check if a specific object is currently selected.
     * @param object The object to check
     * @returns True if the object is selected
     */
    isSelected(object) {
        return this.selectedObjects.has(object);
    }
    /**
     * Programmatically select an object (without triggering click events).
     * @param object The object to select
     * @returns True if the object was selected, false if already selected
     */
    selectObject(object) {
        if (this.selectedObjects.has(object)) {
            return false; // Already selected
        }
        this.effectsManager.selectObject(object);
        this.selectedObjects.add(object);
        this.logSelectionAction(object, true);
        return true;
    }
    /**
     * Programmatically deselect an object (without triggering click events).
     * @param object The object to deselect
     * @returns True if the object was deselected, false if not selected
     */
    deselectObject(object) {
        if (!this.selectedObjects.has(object)) {
            return false; // Not selected
        }
        this.effectsManager.deselectObject(object);
        this.selectedObjects.delete(object);
        this.logSelectionAction(object, false);
        return true;
    }
    /**
     * Programmatically toggle selection of an object.
     * @param object The object to toggle
     * @returns True if the object is now selected, false if deselected
     */
    toggleObjectSelection(object) {
        if (this.selectedObjects.has(object)) {
            this.deselectObject(object);
            return false;
        }
        else {
            this.selectObject(object);
            return true;
        }
    }
    /**
     * Programmatically clear all selections and reset internal state.
     * This method is called when event data is cleared to prevent stale references.
     */
    clearAllSelections() {
        const hadSelections = this.selectedObjects.size > 0;
        // Clear all selected outlines from the effects manager (if initialized)
        this.clearInstanceHighlight();
        if (this.effectsManager) {
            this.effectsManager.clearAllSelections();
        }
        this.selectedObjects.clear();
        // Reset internal tracking to prevent stale references to disposed meshes
        this.hoveredObject = null;
        this.currentlyOutlinedObject = null;
        if (hadSelections && this.infoLogger) {
            this.infoLogger.add('All selections cleared', 'Selection');
        }
    }
    /**
     * Set the click threshold for drag detection.
     * @param threshold Maximum pixel distance to consider as a click (not drag)
     */
    setClickThreshold(threshold) {
        if (threshold > 0) {
            this.clickThreshold = threshold;
        }
    }
    /**
     * Get the current click threshold.
     * @returns Current click threshold in pixels
     */
    getClickThreshold() {
        return this.clickThreshold;
    }
    /**
     * Set the double-click time threshold.
     * @param threshold Maximum time between clicks to consider as double-click (ms)
     */
    setDoubleClickThreshold(threshold) {
        if (threshold > 0) {
            this.doubleClickThreshold = threshold;
        }
    }
    /**
     * Get the current double-click time threshold.
     * @returns Current double-click threshold in milliseconds
     */
    getDoubleClickThreshold() {
        return this.doubleClickThreshold;
    }
    /**
     * Update overlay event listeners when overlay canvas becomes available.
     * Called by ThreeManager when setOverlayRenderer is invoked.
     */
    updateOverlayListeners() {
        this.setupOverlayListeners();
    }
    /**
     * Determine if a mouse event came from the overlay canvas.
     * @param event The mouse event to check
     * @returns true if the event came from the overlay canvas, false if from main canvas
     */
    isEventFromOverlayCanvas(event) {
        const target = event.target;
        // Check if the target is the overlay canvas
        if (this.getOverlayCanvas) {
            const overlayCanvas = this.getOverlayCanvas();
            if (overlayCanvas && target === overlayCanvas) {
                return true;
            }
        }
        return false;
    }
    /**
     * Cleanup all event listeners and resources before re-initialization.
     * Must be called before destroying the SelectionManager or re-initializing.
     */
    cleanup() {
        // Disable selecting (removes selection event listeners)
        this.disableSelecting();
        // Remove passive double-click listeners from both canvases
        this.disablePassiveDoubleClick();
        // Clear all selections and outlines
        if (this.effectsManager) {
            this.effectsManager.clearAllSelections();
            this.effectsManager.setHoverOutline(null);
        }
        this.selectedObjects.clear();
        this.clearInstanceHighlight();
        this.hoveredObject = null;
        this.currentlyOutlinedObject = null;
        // Reset initialization state
        this.isInit = false;
    }
}
/** Highlight color for hovered instanced cells */
SelectionManager.INSTANCE_HIGHLIGHT_COLOR = new Color(0xffffff);
//# sourceMappingURL=selection-manager.js.map