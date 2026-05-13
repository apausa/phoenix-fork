import { PhoenixLoader } from './phoenix-loader';
/**
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export declare class Edm4hepJsonLoader extends PhoenixLoader {
    /** PDG ID to particle type name */
    private static readonly pidNames;
    /** Colors per particle type, shared between tracks and hits
     *  Tracks receive hex color without '#' */
    private static readonly pidColors;
    /**  Event data loaded from EDM4hep JSON file */
    private rawEventData;
    /** Create Edm4hepJsonLoader */
    constructor();
    /** Put raw EDM4hep JSON event data into the loader */
    setRawEventData(rawEventData: any): void;
    /** Process raw EDM4hep JSON event data into the Phoenix format */
    processEventData(): boolean;
    /** Output event data in Phoenix compatible format */
    getEventData(): any;
    /** Return number of events */
    private getNumEvents;
    private assignPID;
    /** Return vertices */
    private getVertices;
    /** Return tracks */
    private getTracks;
    /** Return tracker hits */
    private getHits;
    /** Returns Calo cells */
    private getCaloCells;
    /** Return Calo clusters */
    private getCaloClusters;
    /** Return jets */
    private getJets;
    /** Return missing energy */
    private getMissingEnergy;
    /** Return a random colour */
    private randomColor;
    /** Get the required collection */
    private getCollByID;
    /** Return a lightness value from the passed number and range */
    private valToLightness;
    /** Return a opacity value from the passed number and range */
    private valToOpacity;
    /** Helper conversion of HSL to hexadecimal */
    private convHSLtoHEX;
}
