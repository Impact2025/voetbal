import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Skillkaart from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element niet gevonden');

createRoot(rootElement).render(
  <StrictMode>
    <Skillkaart />
  </StrictMode>,
);
