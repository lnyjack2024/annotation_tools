import { createContext } from 'react';
import { Language } from '../../../../utils/constants';

const LocaleContext = createContext(Language.EN_US);

export default LocaleContext;
