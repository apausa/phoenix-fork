import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Camera, Scene, WebGLRenderer, Mesh } from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
/**
 * Manager for managing three.js event display effects like outline pass and unreal bloom.
 *
 * Selection uses OutlinePass for true silhouette outlines (boundary only, no internal
 * mesh edges). This addresses the feedback that EdgesGeometry showed too many
 * internal edges, especially on jets where all cone triangles were visible.
 *
 * Hover uses EdgesGeometry (15° threshold) for lightweight, immediate feedback.
 *
 * Selection color defaults to amber but is configurable via setSelectionColor()
 * for experiments like LHCb where amber-colored objects are common.
 */
export declare class EffectsManager {
    /** Effect composer for effect passes. */
    composer: EffectComposer;
    /** The camera inside the scene. */
    private camera;
    /** The default scene used for event display. */
    private scene;
    /** Render pass for rendering the default scene. */
    private defaultRenderPass;
    /** Array to keep track of outline passes that need camera updates */
    private outlinePasses;
    /** Whether antialiasing is enabled or disabled. */
    antialiasing: boolean;
    /** WebGL renderer reference */
    private renderer;
    /** Set of currently selected objects */
    private selectedObjectsSet;
    /** OutlinePass for selection silhouette (lazy-initialized on first select) */
    private selectionOutlinePass;
    /** Currently hovered object outline (temporary) */
    private hoverOutline;
    /** Reference to the hovered object for cleanup */
    private hoverTarget;
    /** Render function with (normal render) or without antialias (effects render). */
    render: (scene: Scene, camera: Camera) => void;
    /** Vertex shader for hover outline rendering. */
    private static readonly VERTEX_SHADER;
    /** Fragment shader for hover outlines (static blue). */
    private static readonly HOVER_FRAGMENT_SHADER;
    /**
     * Constructor for the effects manager.
     * @param camera The camera inside the scene.
     * @param scene The default scene used for event display.
     * @param renderer The main renderer used by the event display.
     */
    constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer);
    /**
     * Lazily initialize the selection OutlinePass on first use.
     * Keeps the composer clean until selection is needed, preserving
     * existing tests that check composer.passes.length.
     */
    private ensureSelectionPass;
    /**
     * Render the effects composer with outline support.
     * Called when antialiasing is off (selection mode).
     * @param scene The default scene used for event display.
     * @param camera The camera inside the scene.
     */
    private effectsRender;
    /**
     * Render for antialias without the effects composer.
     * Falls back to composer if there are active selections (OutlinePass needs it).
     * @param scene The default scene used for event display.
     * @param camera The camera inside the scene.
     */
    private antialiasRender;
    /**
     * Initialize an outline pass for external use.
     * @returns OutlinePass for highlighting event display elements.
     */
    addOutlinePassForSelection(): OutlinePass;
    /**
     * Remove a pass from the effect composer.
     * @param pass Effect pass to be removed from the effect composer.
     */
    removePass(pass: Pass): void;
    /**
     * Set the antialiasing of renderer.
     * @param antialias Whether antialiasing is to enabled or disabled.
     */
    setAntialiasing(antialias: boolean): void;
    /**
     * Update the pulsing animation on the selection OutlinePass.
     * Oscillates edgeStrength for a gentle breathing effect.
     */
    private updateSelectionPulse;
    /**
     * Get performance statistics for the outline system.
     * @returns Object containing performance metrics.
     */
    getOutlinePerformanceStats(): {
        selectedObjectsCount: number;
        hasHoverOutline: boolean;
        totalOutlines: number;
    };
    /**
     * Add an object to the selected set (sticky selection).
     * Uses OutlinePass for true silhouette rendering (boundary only).
     * @param object The mesh object to be selected.
     */
    selectObject(object: Mesh): void;
    /**
     * Remove an object from the selected set.
     * @param object The mesh object to be deselected.
     */
    deselectObject(object: Mesh): void;
    /**
     * Toggle selection state of an object.
     * @param object The mesh object to toggle.
     * @returns True if object is now selected, false if deselected.
     */
    toggleSelection(object: Mesh): boolean;
    /**
     * Clear all selected objects.
     */
    clearAllSelections(): void;
    /**
     * Set hover outline for an object (temporary, non-sticky).
     * Uses EdgesGeometry at 15° for visible hover feedback.
     * @param object The mesh object to hover outline, or null to clear.
     */
    setHoverOutline(object: Mesh | null): void;
    /**
     * Set the selection outline color.
     * Default is amber (0xffa633). Experiments with amber-colored objects
     * (e.g. LHCb calorimeter deposits) may want a different color for contrast.
     * @param color The color as a hex number (e.g. 0x00ff00 for green).
     */
    setSelectionColor(color: number): void;
    /**
     * Create an EdgesGeometry hover outline for an object.
     * Added as a child so it inherits transforms and is excluded from raycasts.
     * @param object The mesh object to create hover outline for.
     * @returns The created outline helper.
     */
    private createHoverOutline;
    /**
     * Cleanup and dispose all WebGL resources to prevent memory leaks.
     * Must be called before re-initialization or when destroying the event display.
     */
    cleanup(): void;
}
