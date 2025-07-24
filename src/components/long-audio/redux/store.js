import { createStore } from 'redux';
import reducer from './reducer';

const reduxStore = createStore(reducer);
export default reduxStore;
