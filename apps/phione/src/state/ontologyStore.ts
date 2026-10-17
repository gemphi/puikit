import { createStore } from '@pui/store';
import { ObjectTypeDef, LinkTypeDef, ActionDef } from '../types/ontology';

const INITIAL_TYPES: ObjectTypeDef[] = [
  {
    id: 'flight', apiName: 'Flight', displayName: 'Flight', count: 1420, icon: 'Plane', primaryKey: 'flightId',
    description: 'Commercial and tactical flight missions with real-time telemetry coordinates.',
    properties: [
      { name: 'flightId', type: 'string', required: true, indexed: true },
      { name: 'tailNumber', type: 'string', required: true },
      { name: 'origin', type: 'string', required: true },
      { name: 'destination', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'altitude', type: 'integer', required: true },
      { name: 'fuelLevel', type: 'double', required: true },
      { name: 'telemetryStream', type: 'timeseries', required: false },
    ],
  },
  {
    id: 'airport', apiName: 'Airport', displayName: 'Airport', count: 480, icon: 'Building2', primaryKey: 'iataCode',
    description: 'Global hubs, terminals, runway status, and local weather radar.',
    properties: [
      { name: 'iataCode', type: 'string', required: true, indexed: true },
      { name: 'name', type: 'string', required: true },
      { name: 'city', type: 'string', required: true },
      { name: 'country', type: 'string', required: true },
      { name: 'activeRunways', type: 'integer', required: true },
    ],
  },
  {
    id: 'user', apiName: 'User', displayName: 'User & Identity', count: 3200, icon: 'User', primaryKey: 'userId',
    description: 'Cryptographic identities, RBAC roles, and zero-trust clearance attributes.',
    properties: [
      { name: 'userId', type: 'string', required: true, indexed: true },
      { name: 'fullName', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'role', type: 'string', required: true },
      { name: 'clearance', type: 'string', required: true },
      { name: 'cipherData', type: 'ciphertext', required: false },
    ],
  },
];

const INITIAL_LINKS: LinkTypeDef[] = [
  { id: 'l1', apiName: 'originatesFrom', displayName: 'Originates From', sourceType: 'Flight', targetType: 'Airport', cardinality: 'MANY_TO_ONE' },
  { id: 'l2', apiName: 'landsAt', displayName: 'Lands At', sourceType: 'Flight', targetType: 'Airport', cardinality: 'MANY_TO_ONE' },
  { id: 'l3', apiName: 'dispatchedBy', displayName: 'Dispatched By', sourceType: 'Flight', targetType: 'User', cardinality: 'MANY_TO_ONE' },
];

const INITIAL_ACTIONS: ActionDef[] = [
  { id: 'a1', apiName: 'rerouteFlight', displayName: 'Reroute Flight', targetObjectType: 'Flight', morphismType: 'MODIFY', parameters: [{ name: 'newDestination', type: 'string', required: true }, { name: 'reason', type: 'string', required: true }] },
  { id: 'a2', apiName: 'dispatchEmergency', displayName: 'Dispatch Emergency', targetObjectType: 'Flight', morphismType: 'DISPATCH', parameters: [{ name: 'severity', type: 'string', required: true }] },
  { id: 'a3', apiName: 'rotateUserClearance', displayName: 'Rotate Clearance', targetObjectType: 'User', morphismType: 'MODIFY', parameters: [{ name: 'newClearance', type: 'string', required: true }] },
];

type Row = Record<string, any>;

/** Sample rows for the built-in ontology (used only when no Phient API is configured). */
const SAMPLE_ROWS: Record<string, Row[]> = {
  flight: [
    { flightId: 'FL-101', tailNumber: 'N402AA', origin: 'JFK', destination: 'LHR', status: 'EN_ROUTE', altitude: 34000, fuelLevel: 78 },
    { flightId: 'FL-102', tailNumber: 'N814AA', origin: 'SFO', destination: 'HND', status: 'EN_ROUTE', altitude: 38000, fuelLevel: 64 },
    { flightId: 'FL-103', tailNumber: 'N109AA', origin: 'ORD', destination: 'CDG', status: 'BOARDING', altitude: 0, fuelLevel: 100 },
    { flightId: 'FL-104', tailNumber: 'N902AA', origin: 'LAX', destination: 'SYD', status: 'EN_ROUTE', altitude: 36000, fuelLevel: 82 },
    { flightId: 'FL-105', tailNumber: 'N301AA', origin: 'MIA', destination: 'GRU', status: 'DELAYED', altitude: 0, fuelLevel: 90 },
  ],
  airport: [
    { iataCode: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US', activeRunways: 4 },
    { iataCode: 'LHR', name: 'Heathrow', city: 'London', country: 'GB', activeRunways: 2 },
  ],
  user: [
    { userId: 'u-1', fullName: 'Riya Sharma', email: 'riya@phient.com', role: 'Engineer', clearance: 'L2' },
  ],
};

export interface OntologyStoreState {
  objectTypes: ObjectTypeDef[];
  linkTypes: LinkTypeDef[];
  actions: ActionDef[];
  selectedTypeId: string;
  selectedInstance: Record<string, any> | null;
  /** Instances per type id; undefined = not loaded yet. */
  instances: Record<string, Row[] | undefined>;
  loadingType: string | null;
  selectType: (id: string) => void;
  selectInstance: (inst: Record<string, any> | null) => void;
}

export const ontologyStore = createStore<OntologyStoreState>((set) => ({
  objectTypes: INITIAL_TYPES,
  linkTypes: INITIAL_LINKS,
  actions: INITIAL_ACTIONS,
  selectedTypeId: 'flight',
  selectedInstance: null,
  instances: SAMPLE_ROWS,
  loadingType: null,
  selectType: (selectedTypeId: string) => set({ selectedTypeId, selectedInstance: null }),
  selectInstance: (selectedInstance: Record<string, any> | null) => set({ selectedInstance }),
}));
