import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FoundationScreen } from '../ui/FoundationScreen';
import { translate } from './bootstrap';
import '../ui/foundation.css';

document.title = translate('app.title');
createRoot(document.getElementById('root')!).render(
  <StrictMode><FoundationScreen t={translate} /></StrictMode>,
);
