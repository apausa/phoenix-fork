import { Vector3f, Vector3d, Vector2i, ObjectID } from './utils';
export declare namespace Schema1 {
    /** Vertex */
    type Vertex = {
        primary: number;
        chi2: number;
        probability: number;
        position: Vector3f;
        covMatrix: number[];
        algorithmType: number;
        parameters: number[];
        associatedParticle: ObjectID;
    };
    type TrackState = {
        location: number;
        D0: number;
        phi: number;
        omega: number;
        Z0: number;
        tanLambda: number;
        time: number;
        referencePoint: Vector3f;
        covMatrix: number[];
    };
    /** Reconstructed track */
    type Track = {
        type: number;
        chi2: number;
        ndf: number;
        dEdx: number;
        dEdxError: number;
        radiusOfInnermostHit: number;
        subdetectorHitNumbers: number[];
        trackStates: TrackState[];
        dxQuantities: {
            error: number;
            type: number;
            value: number;
        }[];
        trackerHits: ObjectID[];
        tracks: ObjectID[];
    };
    /** Tracker hit */
    type TrackerHit = {
        cellID: bigint;
        type: number;
        quality: number;
        time: number;
        eDep: number;
        eDepError: number;
        position: Vector3d;
        covMatrix: number[];
        rawHits: ObjectID[];
    };
    /** Simulated tracker hit */
    type SimTrackerHit = {
        cellID: bigint;
        EDep: number;
        time: number;
        pathLength: number;
        quality: number;
        position: Vector3d;
        momentum: Vector3f;
        MCParticle: ObjectID;
    };
    /** Calorimeter hit */
    type CalorimeterHit = {
        cellID: bigint;
        energy: number;
        energyError: number;
        time: number;
        position: Vector3f;
        type: number;
    };
    /** Simulated calorimeter hit */
    type SimCalorimeterHit = {
        cellID: bigint;
        energy: number;
        position: Vector3f;
        contributions: ObjectID[];
    };
    /** Calorimeter Hit Cluster */
    type Cluster = {
        type: number;
        energy: number;
        energyError: number;
        position: Vector3f;
        positionError: number[];
        iTheta: number;
        phi: number;
        directionError: Vector3f;
        shapeParameters: number[];
        subdetectorEnergies: number[];
        clusters: ObjectID[];
        hits: ObjectID[];
        particleIDs: ObjectID[];
    };
    /** Reconstructed Particle */
    type ReconstructedParticle = {
        type: number;
        energy: number;
        momentum: Vector3f;
        referencePoint: Vector3f;
        charge: number;
        mass: number;
        goodnessOfPID: number;
        covMatrix: number[];
        startVertex: ObjectID;
        particleIDUsed: ObjectID;
        clusters: ObjectID[];
        tracks: ObjectID[];
        particles: ObjectID[];
        particleIDs: ObjectID[];
    };
    /** Event Header. Additional parameters are assumed to go into the metadata tree. */
    type EventHeader = {
        eventNumber: number;
        runNumber: number;
        timeStamp: bigint;
        weight: number;
    };
    /** Used to keep track of the correspondence between MC and reconstructed particles */
    type MCRecoParticleAssociation = {
        weight: number;
        rec: ObjectID;
        sim: ObjectID;
    };
    /** The Monte Carlo particle - based on the lcio::MCParticle. */
    type MCParticle = {
        PDG: number;
        generatorStatus: number;
        simulatorStatus: number;
        charge: number;
        time: number;
        mass: number;
        vertex: Vector3d;
        endpoint: Vector3d;
        momentum: Vector3f;
        momentumAtEndpoint: Vector3f;
        spin: Vector3f;
        colorFlow: Vector2i;
        parents: ObjectID[];
        daughters: ObjectID[];
    };
    type EventHeaderCollection = EventHeader[];
    type VertexCollection = Vertex[];
    type TrackCollection = Track[];
    type TrackerHitCollection = TrackerHit[];
    type SimTrackerHitCollection = SimTrackerHit[];
    type CalorimeterHitCollection = CalorimeterHit[];
    type SimCalorimeterHitCollection = SimCalorimeterHit[];
    type ClusterCollection = Cluster[];
    type ReconstructedParticleCollection = ReconstructedParticle[];
    type MCRecoParticleAssociationCollection = MCRecoParticleAssociation[];
    type MCParticleCollection = MCParticle[];
    type Coll = {
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
        collType: 'edm4hep::TrackerHitCollection';
        collection: TrackerHit[];
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
        collType: 'edm4hep::MCRecoParticleAssociation';
        collection: MCRecoParticleAssociation[];
    };
}
