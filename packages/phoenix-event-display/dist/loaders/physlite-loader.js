import { PhoenixLoader } from './phoenix-loader';
import { openFile, settings as jsrootSettings } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';
import { CoordinateHelper } from '../helpers/coordinate-helper';
/**
 * Default PHYSLITE branch mapping for ATLAS Open Data.
 * Branch names verified against the official get_json_phoenix.py script.
 */
const DEFAULT_COLLECTIONS = [
    {
        prefix: 'AnalysisElectronsAuxDyn',
        fields: ['pt', 'eta', 'phi', 'm'],
        phoenixType: 'Electrons',
        collectionName: 'AnalysisElectrons',
    },
    {
        prefix: 'AnalysisMuonsAuxDyn',
        fields: ['pt', 'eta', 'phi'],
        phoenixType: 'Muons',
        collectionName: 'AnalysisMuons',
    },
    {
        prefix: 'AnalysisPhotonsAuxDyn',
        fields: ['pt', 'eta', 'phi', 'm'],
        phoenixType: 'Photons',
        collectionName: 'AnalysisPhotons',
    },
    {
        prefix: 'AnalysisJetsAuxDyn',
        fields: ['pt', 'eta', 'phi', 'm'],
        phoenixType: 'Jets',
        collectionName: 'AnalysisJets',
    },
    {
        prefix: 'AnalysisLargeRJetsAuxDyn',
        fields: ['pt', 'eta', 'phi', 'm'],
        phoenixType: 'Jets',
        collectionName: 'AnalysisLargeRJets',
    },
    {
        prefix: 'InDetTrackParticlesAuxDyn',
        fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
        phoenixType: 'Tracks',
        collectionName: 'InDetTrackParticles',
    },
    {
        prefix: 'MuonSpectrometerTrackParticlesAuxDyn',
        fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
        phoenixType: 'Tracks',
        collectionName: 'MuonSpectrometerTrackParticles',
    },
    {
        prefix: 'CombinedMuonTrackParticlesAuxDyn',
        fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
        phoenixType: 'Tracks',
        collectionName: 'CombinedMuonTrackParticles',
    },
    {
        prefix: 'ExtrapolatedMuonTrackParticlesAuxDyn',
        fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
        phoenixType: 'Tracks',
        collectionName: 'ExtrapolatedMuonTrackParticles',
    },
    {
        prefix: 'GSFTrackParticlesAuxDyn',
        fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
        phoenixType: 'Tracks',
        collectionName: 'GSFTrackParticles',
    },
    {
        prefix: 'MET_Core_AnalysisMETAuxDyn',
        fields: ['mpx', 'mpy'],
        phoenixType: 'MissingEnergy',
        collectionName: 'MET',
    },
    {
        prefix: 'PrimaryVerticesAuxDyn',
        fields: ['x', 'y', 'z'],
        phoenixType: 'Vertices',
        collectionName: 'PrimaryVertices',
    },
    {
        prefix: 'egammaClustersAuxDyn',
        fields: ['calE', 'calEta', 'calPhi'],
        phoenixType: 'CaloClusters',
        collectionName: 'egammaClusters',
    },
];
/**
 * Loader for ATLAS PHYSLITE (DAOD_PHYSLITE) ROOT files.
 *
 * Uses jsroot to read the CollectionTree TTree and converts
 * xAOD auxiliary-data branches into Phoenix event data format.
 */
export class PHYSLITELoader extends PhoenixLoader {
    /**
     * Create a PHYSLITE loader.
     * @param maxEvents Maximum number of events to read from the file.
     */
    constructor(maxEvents = 100) {
        super();
        this.maxEvents = maxEvents;
        this.collectionDefs = DEFAULT_COLLECTIONS;
    }
    /**
     * Open a PHYSLITE ROOT file and return all events as a
     * PhoenixEventsData object (keyed by event name).
     * @param fileSource File object or URL of the .root file.
     * @returns Promise resolving to the events data.
     */
    async getEventData(fileSource) {
        jsrootSettings.UseStamp = false;
        const file = await openFile(fileSource);
        const tree = await file.readObject('CollectionTree');
        if (!tree) {
            throw new Error('No CollectionTree found in this ROOT file. It may not be a PHYSLITE file.');
        }
        const nEntries = tree.fEntries ?? 0;
        const nToProcess = Math.min(nEntries, this.maxEvents);
        if (nToProcess === 0) {
            throw new Error('CollectionTree has no entries.');
        }
        // --- Add branches to the selector, skipping missing collections ---
        // jsroot throws if a non-existent branch is added to treeProcess.
        // AuxDyn branches are stored as flat top-level entries (e.g.
        // "AnalysisJetsAuxDyn.pt"), so we check exact names before adding.
        const topLevelNames = new Set(tree.fBranches.arr.map((b) => b.fName));
        const activeDefs = [];
        const selector = new TSelector();
        for (const def of this.collectionDefs) {
            // Check that at least the first required field branch exists
            const firstBranch = `${def.prefix}.${def.fields[0]}`;
            if (!topLevelNames.has(firstBranch)) {
                continue;
            }
            const keys = {};
            let allFound = true;
            for (const field of def.fields) {
                const branchName = `${def.prefix}.${field}`;
                if (!topLevelNames.has(branchName)) {
                    allFound = false;
                    break;
                }
                const key = `${def.prefix}__${field}`;
                keys[field] = key;
            }
            if (!allFound)
                continue;
            // All branches verified — add them to the selector
            for (const field of def.fields) {
                const branchName = `${def.prefix}.${field}`;
                selector.addBranch(branchName, keys[field]);
            }
            activeDefs.push({ def, selectorKeys: keys });
        }
        // Event info branches (metadata)
        const eventNumberKey = 'evtinfo_eventNumber';
        const runNumberKey = 'evtinfo_runNumber';
        selector.addBranch('EventInfoAuxDyn.eventNumber', eventNumberKey);
        selector.addBranch('EventInfoAuxDyn.runNumber', runNumberKey);
        // --- Process entries ---
        const eventsData = {};
        let eventIndex = 0;
        selector.Process = (entry) => {
            if (eventIndex >= nToProcess) {
                selector.Abort();
                return;
            }
            const tgt = selector.tgtobj;
            const eventNumber = eventNumberKey ? tgt[eventNumberKey] : eventIndex;
            const runNumber = runNumberKey ? tgt[runNumberKey] : 0;
            // Pre-initialize all active collection types so Phoenix registers
            // them from the first event (even if empty for that event).
            const eventData = {
                'event number': eventNumber,
                'run number': runNumber,
            };
            for (const { def } of activeDefs) {
                if (!eventData[def.phoenixType]) {
                    eventData[def.phoenixType] = {};
                }
            }
            for (const { def, selectorKeys } of activeDefs) {
                const collection = this.convertCollection(def, selectorKeys, tgt);
                if (collection && collection.length > 0) {
                    eventData[def.phoenixType][def.collectionName] = collection;
                }
            }
            const eventKey = `Event ${eventNumber}`;
            eventsData[eventKey] = eventData;
            eventIndex++;
        };
        await treeProcess(tree, selector, { numentries: nToProcess });
        return eventsData;
    }
    /**
     * Convert one collection's branch data for a single event entry
     * into an array of Phoenix-format objects.
     */
    convertCollection(def, keys, tgt) {
        switch (def.phoenixType) {
            case 'Electrons':
            case 'Muons':
                return this.convertCompoundObjects(keys, tgt, true);
            case 'Photons':
                return this.convertCompoundObjects(keys, tgt, false);
            case 'Jets':
                return this.convertJets(keys, tgt);
            case 'Tracks':
                return this.convertTracks(keys, tgt);
            case 'MissingEnergy':
                return this.convertMET(keys, tgt);
            case 'Vertices':
                return this.convertVertices(keys, tgt);
            case 'CaloClusters':
                return this.convertCaloClusters(keys, tgt);
            default:
                return null;
        }
    }
    /**
     * Convert compound objects (Electrons, Muons, Photons).
     * These are rendered as extrapolated tracks (charged) or clusters (neutral).
     * Energy is computed from pt, eta, and mass: E = sqrt((pt*cosh(eta))^2 + m^2).
     */
    convertCompoundObjects(keys, tgt, isCharged) {
        const ptArr = keys['pt'] ? this.toArray(tgt[keys['pt']]) : null;
        const etaArr = keys['eta'] ? this.toArray(tgt[keys['eta']]) : null;
        const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
        const mArr = keys['m'] ? this.toArray(tgt[keys['m']]) : null;
        if (!etaArr || !phiArr)
            return [];
        const n = etaArr.length;
        const objects = [];
        for (let i = 0; i < n; i++) {
            const eta = etaArr[i];
            const phi = phiArr[i];
            const pt = ptArr ? ptArr[i] : 0; // MeV
            const m = mArr ? mArr[i] : 0;
            // E = sqrt((pt*cosh(eta))^2 + m^2)
            const p = pt * Math.cosh(eta);
            const energy = Math.sqrt(p * p + m * m);
            const obj = {
                eta,
                phi,
                pt,
                energy,
            };
            // For charged particles, derive sign from charge if available,
            // otherwise assume negative (electron/muon convention)
            if (isCharged) {
                // PHYSLITE muons don't have explicit pt — they are linked to tracks.
                // For electrons, charge can be inferred from track qOverP sign.
                // Default to negative charge convention for track curvature.
                obj.pdgId = -1;
            }
            objects.push(obj);
        }
        return objects;
    }
    /**
     * Convert jet branch data into Phoenix JetParams array.
     * Energy computed from pt, eta, m: E = sqrt((pt*cosh(eta))^2 + m^2).
     */
    convertJets(keys, tgt) {
        const ptArr = keys['pt'] ? this.toArray(tgt[keys['pt']]) : null;
        const etaArr = keys['eta'] ? this.toArray(tgt[keys['eta']]) : null;
        const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
        const mArr = keys['m'] ? this.toArray(tgt[keys['m']]) : null;
        if (!etaArr || !phiArr)
            return [];
        const n = etaArr.length;
        const jets = [];
        for (let i = 0; i < n; i++) {
            const pt = ptArr ? ptArr[i] : 0;
            const eta = etaArr[i];
            const m = mArr ? mArr[i] : 0;
            const p = pt * Math.cosh(eta);
            const energy = Math.sqrt(p * p + m * m);
            jets.push({
                eta,
                phi: phiArr[i],
                energy,
            });
        }
        return jets;
    }
    /**
     * Convert InDetTrackParticles branch data into Phoenix TrackParams array.
     * Uses dparams [d0, z0, phi, theta, qOverP] for Runge-Kutta extrapolation.
     */
    convertTracks(keys, tgt) {
        const d0Arr = keys['d0'] ? this.toArray(tgt[keys['d0']]) : null;
        const z0Arr = keys['z0'] ? this.toArray(tgt[keys['z0']]) : null;
        const thetaArr = keys['theta'] ? this.toArray(tgt[keys['theta']]) : null;
        const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
        const qOverPArr = keys['qOverP'] ? this.toArray(tgt[keys['qOverP']]) : null;
        if (!phiArr || !thetaArr || !qOverPArr)
            return [];
        const n = phiArr.length;
        const tracks = [];
        for (let i = 0; i < n; i++) {
            const d0 = d0Arr ? d0Arr[i] : 0;
            const z0 = z0Arr ? z0Arr[i] : 0;
            const phi = phiArr[i];
            const theta = thetaArr[i];
            const qOverP = qOverPArr[i];
            // Skip tracks with invalid parameters to avoid NaN in Runge-Kutta
            if (!qOverP ||
                !isFinite(1.0 / qOverP) ||
                theta <= 0 ||
                theta >= Math.PI) {
                continue;
            }
            const p = Math.abs(1.0 / qOverP);
            const pt = p * Math.sin(theta);
            const eta = CoordinateHelper.thetaToEta(theta);
            tracks.push({
                dparams: [d0, z0, phi, theta, qOverP],
                phi,
                eta,
                pT: pt,
                d0,
                z0,
            });
        }
        return tracks;
    }
    /**
     * Convert MET branch data into Phoenix MissingEnergyParams array.
     */
    convertMET(keys, tgt) {
        const mpx = keys['mpx'] ? tgt[keys['mpx']] : null;
        const mpy = keys['mpy'] ? tgt[keys['mpy']] : null;
        if (mpx == null || mpy == null)
            return [];
        // MET may be a single value or an array with one element
        return [
            {
                etx: typeof mpx === 'number' ? mpx : (mpx[0] ?? 0),
                ety: typeof mpy === 'number' ? mpy : (mpy[0] ?? 0),
            },
        ];
    }
    /**
     * Convert PrimaryVertices branch data into Phoenix VertexParams array.
     */
    convertVertices(keys, tgt) {
        const xArr = keys['x'] ? this.toArray(tgt[keys['x']]) : null;
        const yArr = keys['y'] ? this.toArray(tgt[keys['y']]) : null;
        const zArr = keys['z'] ? this.toArray(tgt[keys['z']]) : null;
        if (!xArr || !yArr || !zArr)
            return [];
        const n = xArr.length;
        const vertices = [];
        for (let i = 0; i < n; i++) {
            vertices.push({
                x: xArr[i],
                y: yArr[i],
                z: zArr[i],
            });
        }
        return vertices;
    }
    /**
     * Convert egammaClusters branch data into Phoenix CaloClusterParams array.
     */
    convertCaloClusters(keys, tgt) {
        const eArr = keys['calE'] ? this.toArray(tgt[keys['calE']]) : null;
        const etaArr = keys['calEta'] ? this.toArray(tgt[keys['calEta']]) : null;
        const phiArr = keys['calPhi'] ? this.toArray(tgt[keys['calPhi']]) : null;
        if (!eArr || !etaArr || !phiArr)
            return [];
        const n = eArr.length;
        const clusters = [];
        for (let i = 0; i < n; i++) {
            clusters.push({
                energy: eArr[i],
                eta: etaArr[i],
                phi: phiArr[i],
            });
        }
        return clusters;
    }
    /**
     * Ensure a value is a plain array (jsroot may return typed arrays).
     */
    toArray(val) {
        if (val == null)
            return null;
        if (Array.isArray(val))
            return val;
        if (ArrayBuffer.isView(val))
            return Array.from(val);
        if (typeof val === 'number')
            return [val];
        return null;
    }
}
//# sourceMappingURL=physlite-loader.js.map