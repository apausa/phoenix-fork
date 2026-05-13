import { PhoenixLoader } from './phoenix-loader';
/**
 * Loader for ATLAS PHYSLITE (DAOD_PHYSLITE) ROOT files.
 *
 * Uses jsroot to read the CollectionTree TTree and converts
 * xAOD auxiliary-data branches into Phoenix event data format.
 */
export declare class PHYSLITELoader extends PhoenixLoader {
    /** Maximum number of events to load from the file. */
    private maxEvents;
    /** Collection definitions describing which branches to read. */
    private collectionDefs;
    /**
     * Create a PHYSLITE loader.
     * @param maxEvents Maximum number of events to read from the file.
     */
    constructor(maxEvents?: number);
    /**
     * Open a PHYSLITE ROOT file and return all events as a
     * PhoenixEventsData object (keyed by event name).
     * @param fileSource File object or URL of the .root file.
     * @returns Promise resolving to the events data.
     */
    getEventData(fileSource: File | string): Promise<any>;
    /**
     * Convert one collection's branch data for a single event entry
     * into an array of Phoenix-format objects.
     */
    private convertCollection;
    /**
     * Convert compound objects (Electrons, Muons, Photons).
     * These are rendered as extrapolated tracks (charged) or clusters (neutral).
     * Energy is computed from pt, eta, and mass: E = sqrt((pt*cosh(eta))^2 + m^2).
     */
    private convertCompoundObjects;
    /**
     * Convert jet branch data into Phoenix JetParams array.
     * Energy computed from pt, eta, m: E = sqrt((pt*cosh(eta))^2 + m^2).
     */
    private convertJets;
    /**
     * Convert InDetTrackParticles branch data into Phoenix TrackParams array.
     * Uses dparams [d0, z0, phi, theta, qOverP] for Runge-Kutta extrapolation.
     */
    private convertTracks;
    /**
     * Convert MET branch data into Phoenix MissingEnergyParams array.
     */
    private convertMET;
    /**
     * Convert PrimaryVertices branch data into Phoenix VertexParams array.
     */
    private convertVertices;
    /**
     * Convert egammaClusters branch data into Phoenix CaloClusterParams array.
     */
    private convertCaloClusters;
    /**
     * Ensure a value is a plain array (jsroot may return typed arrays).
     */
    private toArray;
}
