
import { createRoot } from 'react-dom/client';
import Widget from './Widget';
import tailwindStyles from './index.css?inline'; // The ?inline is crucial!

(function initializeOmnixWidget() {
  // 1. Find the script tag the admin pasted
  const currentScript = document.currentScript as HTMLScriptElement || 
    document.querySelector('script[data-workspace-id]');

  if (!currentScript) {
    console.error("Omnix AI: Missing script tag.");
    return;
  }

  const workspaceId = currentScript.getAttribute('data-workspace-id');

  if (!workspaceId) {
    console.error("Omnix AI: 'data-workspace-id' is required.");
    return;
  }

  // 2. Prevent multiple injections if they paste it twice
  if (document.getElementById('omnix-ai-root')) return;

  // 3. Create the Shadow DOM host container
  const hostElement = document.createElement('div');
  hostElement.id = 'omnix-ai-root';
  hostElement.style.position = 'fixed'; 
  hostElement.style.zIndex = '2147483647'; // Maximum z-index to stay on top
  document.body.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // 4. Inject Tailwind CSS securely into the Shadow DOM
  const styleElement = document.createElement('style');
  styleElement.textContent = tailwindStyles;
  shadowRoot.appendChild(styleElement);

  // 5. Mount the React Tree inside the Shadow DOM
  const reactRoot = document.createElement('div');
  shadowRoot.appendChild(reactRoot);

  const root = createRoot(reactRoot);
  root.render(
    <Widget 
      workspaceId={workspaceId} 
      currentDomain={window.location.hostname} 
    />
  );
})();