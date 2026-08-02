
import { createRoot } from 'react-dom/client';
import tailwindStyles from './index.css?inline'
import Widget from './Widget';
console.log("✅ Omnix content script loaded");
const hostElement = document.createElement('div');
hostElement.id = 'omnix-ai-root';
document.body.appendChild(hostElement);

const shadowRoot = hostElement.attachShadow({mode:'open'});

const styleElement = document.createElement('style');
styleElement.textContent = tailwindStyles;
shadowRoot.appendChild(styleElement);

const reactRoot = document.createElement('div');
shadowRoot.appendChild(reactRoot);

const root = createRoot(reactRoot);
root.render(<Widget currentDomain={window.location.hostname} />);