import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Vector2, ShaderMaterial, EdgesGeometry, LineSegments, NormalBlending, } from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
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
export class EffectsManager {
    /**
     * Constructor for the effects manager.
     * @param camera The camera inside the scene.
     * @param scene The default scene used for event display.
     * @param renderer The main renderer used by the event display.
     */
    constructor(camera, scene, renderer) {
        /** Array to keep track of outline passes that need camera updates */
        this.outlinePasses = [];
        /** Whether antialiasing is enabled or disabled. */
        this.antialiasing = true;
        // Selection support (OutlinePass — true silhouette)
        /** Set of currently selected objects */
        this.selectedObjectsSet = new Set();
        /** OutlinePass for selection silhouette (lazy-initialized on first select) */
        this.selectionOutlinePass = null;
        // Hover support (EdgesGeometry — lightweight)
        /** Currently hovered object outline (temporary) */
        this.hoverOutline = null;
        /** Reference to the hovered object for cleanup */
        this.hoverTarget = null;
        this.composer = new EffectComposer(renderer);
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.defaultRenderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.defaultRenderPass);
        // Set the starting render function
        this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
    }
    /**
     * Lazily initialize the selection OutlinePass on first use.
     * Keeps the composer clean until selection is needed, preserving
     * existing tests that check composer.passes.length.
     */
    ensureSelectionPass() {
        if (!this.selectionOutlinePass) {
            this.selectionOutlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
            this.selectionOutlinePass.visibleEdgeColor.set(0xffcc44); // bright amber
            this.selectionOutlinePass.hiddenEdgeColor.set(0x190a05);
            this.selectionOutlinePass.edgeGlow = 0; // no glow bleeding onto neighbors
            this.selectionOutlinePass.edgeThickness = 1; // tight silhouette line
            this.selectionOutlinePass.edgeStrength = 3;
            this.selectionOutlinePass.pulsePeriod = 0; // we handle pulsing manually
            this.selectionOutlinePass.enabled = false;
            this.composer.addPass(this.selectionOutlinePass);
            this.outlinePasses.push(this.selectionOutlinePass);
        }
        return this.selectionOutlinePass;
    }
    /**
     * Render the effects composer with outline support.
     * Called when antialiasing is off (selection mode).
     * @param scene The default scene used for event display.
     * @param camera The camera inside the scene.
     */
    effectsRender(scene, camera) {
        if (this.composer) {
            this.defaultRenderPass.camera = camera;
            this.defaultRenderPass.scene = scene;
            for (const outlinePass of this.outlinePasses) {
                outlinePass.renderCamera = camera;
            }
            this.updateSelectionPulse();
            this.composer.render();
        }
    }
    /**
     * Render for antialias without the effects composer.
     * Falls back to composer if there are active selections (OutlinePass needs it).
     * @param scene The default scene used for event display.
     * @param camera The camera inside the scene.
     */
    antialiasRender(scene, camera) {
        if (this.selectedObjectsSet.size > 0) {
            // Selections require OutlinePass which needs the composer
            this.defaultRenderPass.camera = camera;
            this.defaultRenderPass.scene = scene;
            for (const outlinePass of this.outlinePasses) {
                outlinePass.renderCamera = camera;
            }
            this.updateSelectionPulse();
            this.composer.render();
        }
        else if (this.hoverOutline) {
            // Hover outlines are scene children, direct render handles them
            this.renderer.render(scene, camera);
        }
        else {
            this.composer.renderer.render(scene, camera);
        }
    }
    /**
     * Initialize an outline pass for external use.
     * @returns OutlinePass for highlighting event display elements.
     */
    addOutlinePassForSelection() {
        const outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        outlinePass.overlayMaterial.blending = NormalBlending;
        outlinePass.visibleEdgeColor.set(0xdf5330);
        this.composer.addPass(outlinePass);
        // Keep track for camera updates
        this.outlinePasses.push(outlinePass);
        return outlinePass;
    }
    /**
     * Remove a pass from the effect composer.
     * @param pass Effect pass to be removed from the effect composer.
     */
    removePass(pass) {
        const passIndex = this.composer.passes.indexOf(pass);
        if (passIndex > -1) {
            this.composer.passes.splice(passIndex, 1);
        }
        // If it's an outline pass, remove from tracking array
        if (pass instanceof OutlinePass) {
            const outlineIndex = this.outlinePasses.indexOf(pass);
            if (outlineIndex > -1) {
                this.outlinePasses.splice(outlineIndex, 1);
            }
        }
    }
    /**
     * Set the antialiasing of renderer.
     * @param antialias Whether antialiasing is to enabled or disabled.
     */
    setAntialiasing(antialias) {
        this.antialiasing = antialias;
        this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
    }
    /**
     * Update the pulsing animation on the selection OutlinePass.
     * Oscillates edgeStrength for a gentle breathing effect.
     */
    updateSelectionPulse() {
        if (this.selectionOutlinePass && this.selectedObjectsSet.size > 0) {
            const time = performance.now() * 0.001;
            // Pulse between 1.5 and 4.5 — always visible, gentle breathing
            this.selectionOutlinePass.edgeStrength = 3 + 1.5 * Math.sin(time * 2.5);
        }
    }
    /**
     * Get performance statistics for the outline system.
     * @returns Object containing performance metrics.
     */
    getOutlinePerformanceStats() {
        return {
            selectedObjectsCount: this.selectedObjectsSet.size,
            hasHoverOutline: !!this.hoverOutline,
            totalOutlines: this.selectedObjectsSet.size + (this.hoverOutline ? 1 : 0),
        };
    }
    /**
     * Add an object to the selected set (sticky selection).
     * Uses OutlinePass for true silhouette rendering (boundary only).
     * @param object The mesh object to be selected.
     */
    selectObject(object) {
        if (this.selectedObjectsSet.has(object)) {
            return;
        }
        this.selectedObjectsSet.add(object);
        const pass = this.ensureSelectionPass();
        pass.selectedObjects = Array.from(this.selectedObjectsSet);
        pass.enabled = true;
    }
    /**
     * Remove an object from the selected set.
     * @param object The mesh object to be deselected.
     */
    deselectObject(object) {
        if (!this.selectedObjectsSet.has(object)) {
            return;
        }
        this.selectedObjectsSet.delete(object);
        if (this.selectionOutlinePass) {
            this.selectionOutlinePass.selectedObjects = Array.from(this.selectedObjectsSet);
            this.selectionOutlinePass.enabled = this.selectedObjectsSet.size > 0;
        }
    }
    /**
     * Toggle selection state of an object.
     * @param object The mesh object to toggle.
     * @returns True if object is now selected, false if deselected.
     */
    toggleSelection(object) {
        if (this.selectedObjectsSet.has(object)) {
            this.deselectObject(object);
            return false;
        }
        else {
            this.selectObject(object);
            return true;
        }
    }
    /**
     * Clear all selected objects.
     */
    clearAllSelections() {
        this.selectedObjectsSet.clear();
        if (this.selectionOutlinePass) {
            this.selectionOutlinePass.selectedObjects = [];
            this.selectionOutlinePass.enabled = false;
        }
    }
    /**
     * Set hover outline for an object (temporary, non-sticky).
     * Uses EdgesGeometry at 15° for visible hover feedback.
     * @param object The mesh object to hover outline, or null to clear.
     */
    setHoverOutline(object) {
        // Clear existing hover outline
        if (this.hoverOutline) {
            this.hoverOutline.removeFromParent();
            this.hoverOutline.geometry.dispose();
            this.hoverOutline.material.dispose();
            this.hoverOutline = null;
            this.hoverTarget = null;
        }
        // Create new hover outline if object provided and not already selected
        if (object && !this.selectedObjectsSet.has(object)) {
            this.hoverOutline = this.createHoverOutline(object);
            this.hoverTarget = object;
            // Add as child so outline inherits all transformations
            object.add(this.hoverOutline);
        }
    }
    /**
     * Set the selection outline color.
     * Default is amber (0xffa633). Experiments with amber-colored objects
     * (e.g. LHCb calorimeter deposits) may want a different color for contrast.
     * @param color The color as a hex number (e.g. 0x00ff00 for green).
     */
    setSelectionColor(color) {
        const pass = this.ensureSelectionPass();
        pass.visibleEdgeColor.set(color);
    }
    /**
     * Create an EdgesGeometry hover outline for an object.
     * Added as a child so it inherits transforms and is excluded from raycasts.
     * @param object The mesh object to create hover outline for.
     * @returns The created outline helper.
     */
    createHoverOutline(object) {
        // 15° threshold: shows enough edges for clear visibility without clutter
        const edges = new EdgesGeometry(object.geometry, 15);
        const lineMaterial = new ShaderMaterial({
            vertexShader: EffectsManager.VERTEX_SHADER,
            fragmentShader: EffectsManager.HOVER_FRAGMENT_SHADER,
            uniforms: {
                opacity: { value: 0.8 },
            },
            transparent: true,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        const outlineHelper = new LineSegments(edges, lineMaterial);
        // Prevent hover flicker: outline intercepts raycast → removed → cycle
        outlineHelper.raycast = () => { };
        // Identity transform — child of target, inherits transformations
        outlineHelper.position.set(0, 0, 0);
        outlineHelper.rotation.set(0, 0, 0);
        outlineHelper.scale.set(1, 1, 1);
        return outlineHelper;
    }
    /**
     * Cleanup and dispose all WebGL resources to prevent memory leaks.
     * Must be called before re-initialization or when destroying the event display.
     */
    cleanup() {
        // Clear all selections (resets OutlinePass)
        this.clearAllSelections();
        // Clear hover outline (disposes geometry and material)
        this.setHoverOutline(null);
        // Dispose the selection outline pass
        if (this.selectionOutlinePass) {
            this.selectionOutlinePass.dispose();
            const passIndex = this.composer.passes.indexOf(this.selectionOutlinePass);
            if (passIndex > -1) {
                this.composer.passes.splice(passIndex, 1);
            }
            const outlineIndex = this.outlinePasses.indexOf(this.selectionOutlinePass);
            if (outlineIndex > -1) {
                this.outlinePasses.splice(outlineIndex, 1);
            }
            this.selectionOutlinePass = null;
        }
        // Dispose remaining outline passes
        for (const pass of this.outlinePasses) {
            if (pass.dispose) {
                pass.dispose();
            }
            const passIndex = this.composer.passes.indexOf(pass);
            if (passIndex > -1) {
                this.composer.passes.splice(passIndex, 1);
            }
        }
        this.outlinePasses = [];
        // Dispose the effect composer (frees render targets/framebuffers)
        if (this.composer) {
            this.composer.dispose();
        }
    }
}
/** Vertex shader for hover outline rendering. */
EffectsManager.VERTEX_SHADER = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
/** Fragment shader for hover outlines (static blue). */
EffectsManager.HOVER_FRAGMENT_SHADER = `
    uniform float opacity;
    void main() {
      vec3 color = vec3(0.2, 0.6, 1.0);
      gl_FragColor = vec4(color, opacity);
    }
  `;
//# sourceMappingURL=effects-manager.js.map