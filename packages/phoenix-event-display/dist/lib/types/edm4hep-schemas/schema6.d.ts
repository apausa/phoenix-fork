import { CovMatrix3f, CovMatrix4f, CovMatrix6f, Vector2f, Vector3f, Vector3d, ObjectID } from './utils';
export declare namespace Schema6 {
    /** Vertex */
    export type Vertex = {
        type: number;
        chi2: number;
        ndf: number;
        position: Vector3f;
        covMatrix: CovMatrix3f;
        algorithmType: number;
        parameters: number[];
        particles: ObjectID[];
    };
    /** Parametrized description of a particle track */
    export type TrackState = {
        location: number;
        D0: number;
        phi: number;
        omega: number;
        Z0: number;
        tanLambda: number;
        time: number;
        referencePoint: Vector3f;
        covMatrix: CovMatrix6f;
    };
    /** Reconstructed track */
    export type Track = {
        type: number;
        chi2: number;
        ndf: number;
        Nholes: number;
        subdetectorHitNumbers: number[];
        subdetectorHoleNumbers: number[];
        trackStates: TrackState[];
        trackerHits: ObjectID[];
        tracks: ObjectID[];
    };
    /** Tracker hit interface class */
    interface TrackerHit {
        cellID: bigint;
        type: number;
        quality: number;
        time: number;
        eDep: number;
        eDepError: number;
        position: Vector3d;
    }
    /** Tracker hit */
    export interface TrackerHit3D extends TrackerHit {
        cellID: bigint;
        type: number;
        quality: number;
        time: number;
        eDep: number;
        eDepError: number;
        position: Vector3d;
        covMatrix: CovMatrix3f;
    }
    /** Tracker hit plane */
    export interface TrackerHitPlane extends TrackerHit {
        cellID: bigint;
        type: number;
        quality: number;
        time: number;
        eDep: number;
        eDepError: number;
        u: Vector2f;
        v: Vector2f;
        du: number;
        dv: number;
        position: Vector3d;
        covMatrix: CovMatrix3f;
    }
    /** Sense wire hit, knowing only the distance to the wire. The circle representing possible positions is parametrized with its center, radius and normal vector (given by the wire direction). */
    export interface SenseWireHit extends TrackerHit {
        cellID: bigint;
        type: number;
        quality: number;
        time: number;
        eDep: number;
        eDepError: number;
        wireStereoAngle: number;
        wireAzimuthalAngle: number;
        position: Vector3d;
        positionAlongWireError: number;
        distanceToWire: number;
        distanceToWireError: number;
        nElectrons: number[];
    }
    /** Simulated tracker hit */
    export type SimTrackerHit = {
        cellID: bigint;
        eDep: number;
        time: number;
        pathLength: number;
        quality: number;
        position: Vector3d;
        momentum: Vector3f;
        particle: ObjectID[];
    };
    /** Calorimeter hit */
    export type CalorimeterHit = {
        cellID: bigint;
        energy: number;
        energyError: number;
        time: number;
        position: Vector3f;
        type: number;
    };
    /** Simulated calorimeter hit */
    export type SimCalorimeterHit = {
        cellID: bigint;
        energy: number;
        position: Vector3f;
        contributions: ObjectID[];
    };
    /** Calorimeter Hit Cluster */
    export type Cluster = {
        type: number;
        energy: number;
        energyError: number;
        position: Vector3f;
        positionError: CovMatrix3f;
        iTheta: number;
        iPhi: number;
        directionError: Vector3f;
        shapeParameters: number[];
        subdetectorEnergies: number[];
        clusters: ObjectID[];
        hits: ObjectID[];
    };
    /** Reconstructed Particle */
    export type ReconstructedParticle = {
        PDG: number;
        energy: number;
        momentum: Vector3f;
        referencePoint: Vector3f;
        charge: number;
        mass: number;
        goodnessOfPID: number;
        covMatrix: CovMatrix4f;
        decayVertex: ObjectID;
        clusters: ObjectID[];
        tracks: ObjectID[];
        particles: ObjectID[];
    };
    /** Event Header. Additional parameters are assumed to go into the metadata tree. */
    export type EventHeader = {
        eventNumber: bigint;
        runNumber: number;
        timeStamp: bigint;
        weight: number;
        weights: number[];
    };
    /** Link between a ReconstructedParticle and an MCParticle */
    export type RecoMCParticleLink = {
        weight: number;
        from: ObjectID;
        to: ObjectID;
    };
    /** The Monte Carlo particle - based on the lcio::MCParticle. */
    export type MCParticle = {
        PDG: number;
        generatorStatus: number;
        simulatorStatus: number;
        charge: number;
        time: number;
        mass: number;
        vertex: Vector3d;
        endpoint: Vector3d;
        momentum: Vector3d;
        momentumAtEndpoint: Vector3d;
        helicity: number;
        parents: ObjectID[];
        daughters: ObjectID[];
    };
    export type Coll = {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::EventHeaderCollection';
        collection: EventHeader[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::VertexCollection';
        collection: Vertex[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackCollection';
        collection: Track[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackerHit3DCollection';
        collection: TrackerHit3D[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackerHitPlaneCollection';
        collection: TrackerHitPlane[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::SenseWireHitCollection';
        collection: SenseWireHit[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::SimTrackerHitCollection';
        collection: SimTrackerHit[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::CalorimeterHitCollection';
        collection: CalorimeterHit[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::SimCalorimeterHitCollection';
        collection: SimCalorimeterHit[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::ClusterCollection';
        collection: Cluster[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::ReconstructedParticleCollection';
        collection: ReconstructedParticle[];
    } | {
        collID: number;
        collSchemaVersion: number;
        collType: 'podio::LinkCollection<edm4hep::ReconstructedParticle,edm4hep::MCParticle>';
        collection: RecoMCParticleLink[];
    };
    export {};
}
