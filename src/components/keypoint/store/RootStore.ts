import OntologyStore from './OntologyStore';
import UndoStore from './UndoStore';
import SettingsStore from './SettingsStore';
import ReviewsStore from './ReviewsStore';
import ShapeStore from './ShapeStore';
import HandleStore from './HandleStore';
import { Payload } from '../types';

/**
 * root store
 * @class
 */
class RootStore {
  ontology: OntologyStore;

  undo: UndoStore;

  review: ReviewsStore;

  setting: SettingsStore;

  shape: ShapeStore;

  handle: HandleStore;

  constructor() {
    this.ontology = new OntologyStore(this);
    this.undo = new UndoStore(this);
    this.review = new ReviewsStore(this);
    this.setting = new SettingsStore(this);
    this.shape = new ShapeStore(this);
    this.handle = new HandleStore(this);
  }

  async init(payload: Payload) {
    this.ontology.setOntology(payload.ontology);
    this.setting.initPayload(payload);
    this.review.init(payload.jobProxy.toolMode, payload.issue_types);

    const reviews = await payload.jobProxy.loadReviews();
    this.review.setInitialData(reviews);
  }
}
const rootStore = new RootStore();

export type RootStoreType = typeof rootStore;

export default rootStore;
