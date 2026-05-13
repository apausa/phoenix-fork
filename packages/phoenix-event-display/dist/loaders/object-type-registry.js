import { Vector3 } from 'three';
import { Cut } from '../lib/models/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';
/** Returns default configs for all built-in Phoenix object types. */
export function getDefaultObjectTypeConfigs() {
    const pi = parseFloat(Math.PI.toFixed(2));
    return [
        {
            typeName: 'Tracks',
            getObject: PhoenixObjects.getTrack,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -4, 4, 0.1),
                new Cut('chi2', 0, 100),
                new Cut('dof', 0, 100),
                new Cut('pT', 0, 50000, 0.1),
                new Cut('z0', -30, 30, 0.1),
                new Cut('d0', -30, 30, 0.1),
            ],
        },
        {
            typeName: 'Jets',
            getObject: PhoenixObjects.getJet,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -5.0, 5.0, 0.1),
                new Cut('energy', 0, 600000, 100),
            ],
            scaleConfig: {
                key: 'jetsScale',
                label: 'Jets Scale',
                scaleMethod: 'scaleJets',
            },
        },
        {
            typeName: 'Hits',
            getObject: PhoenixObjects.getHits,
            concatonateObjs: true,
        },
        {
            typeName: 'CaloClusters',
            getObject: (params) => PhoenixObjects.getCluster(params),
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -5.0, 5.0, 0.1),
                new Cut('energy', 0, 10000),
            ],
            scaleConfig: {
                key: 'caloClustersScale',
                label: 'CaloClusters Scale',
                scaleMethod: 'scaleChildObjects',
                scaleAxis: 'z',
            },
        },
        {
            typeName: 'CaloCells',
            getObject: PhoenixObjects.getCaloCellsInstanced,
            concatonateObjs: true,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -5.0, 5.0, 0.1),
                new Cut('energy', 0, 10000),
            ],
            scaleConfig: {
                key: 'caloCellsScale',
                label: 'CaloCells Scale',
                scaleMethod: 'scaleInstancedObjects',
                scaleAxis: 'z',
            },
        },
        {
            typeName: 'PlanarCaloCells',
            getObject: PhoenixObjects.getPlanarCaloCell,
            cuts: [new Cut('energy', 0, 10000)],
            scaleConfig: {
                key: 'planarCaloCellsScale',
                label: 'PlanarCaloCells Scale',
                scaleMethod: 'scaleChildObjects',
                scaleAxis: 'z',
            },
            preprocessData: (data) => {
                // Flatten { collectionName: { plane, cells } } into { collectionName: cells[] }
                const collections = {};
                for (const collectionName in data) {
                    const collection = data[collectionName];
                    const plane = collection['plane'];
                    const unitVector = new Vector3(...plane.slice(0, 3)).normalize();
                    collection['cells'].forEach((cell) => (cell['plane'] = [...unitVector.toArray(), plane[3]]));
                    collections[collectionName] = collection['cells'];
                }
                return collections;
            },
        },
        {
            typeName: 'IrregularCaloCells',
            getObject: PhoenixObjects.getIrregularCaloCell,
            cuts: [new Cut('layer', 0, 10), new Cut('energy', 0, 10000)],
            scaleConfig: {
                key: 'IrregularCaloCellsScale',
                label: 'IrregularCaloCells Scale',
                scaleMethod: 'scaleChildObjects',
                scaleAxis: 'z',
            },
        },
        // Compound types — getObject is set to null here; PhoenixLoader
        // binds its own getCompoundTrack / getCompoundCluster at runtime
        {
            typeName: 'Muons',
            getObject: null,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -4, 4, 0.1),
                new Cut('energy', 0, 10000),
                new Cut('pT', 0, 50000),
            ],
        },
        {
            typeName: 'Photons',
            getObject: null,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -4, 4, 0.1),
                new Cut('energy', 0, 10000),
                new Cut('pT', 0, 50000),
            ],
        },
        {
            typeName: 'Electrons',
            getObject: null,
            cuts: [
                new Cut('phi', -pi, pi, 0.01),
                new Cut('eta', -4, 4, 0.1),
                new Cut('energy', 0, 10000),
                new Cut('pT', 0, 50000),
            ],
        },
        {
            typeName: 'Vertices',
            getObject: PhoenixObjects.getVertex,
            cuts: [new Cut('vertexType', 0, 5)],
            scaleConfig: {
                key: 'verticesScale',
                label: 'Vertices Scale',
                scaleMethod: 'scaleChildObjects',
            },
        },
        {
            typeName: 'MissingEnergy',
            getObject: PhoenixObjects.getMissingEnergy,
            cuts: [],
            extendUI: (typeFolder, typeFolderPM, scaleChildObjects) => {
                const scaleMET = (value) => {
                    scaleChildObjects('MissingEnergy', value);
                };
                if (typeFolder) {
                    const sizeMenu = typeFolder
                        .add({ jetsScale: 100 }, 'jetsScale', 1, 200)
                        .name('Size (%)');
                    sizeMenu.onChange(scaleMET);
                }
                if (typeFolderPM) {
                    typeFolderPM.addConfig({
                        type: 'slider',
                        label: 'Size (%)',
                        value: 100,
                        min: 1,
                        max: 200,
                        allowCustomValue: true,
                        onChange: scaleMET,
                    });
                }
            },
        },
    ];
}
//# sourceMappingURL=object-type-registry.js.map