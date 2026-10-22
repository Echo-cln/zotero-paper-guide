import { registerReaderAssistant } from "./modules/readerAssistant";

let unregisterReaderAssistant: (() => void) | undefined;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  unregisterReaderAssistant = registerReaderAssistant();
  addon.data.initialized = true;
}

function onShutdown() {
  unregisterReaderAssistant?.();
  unregisterReaderAssistant = undefined;
  addon.data.alive = false;
  // @ts-expect-error Zotero plugin global instance is removed on shutdown
  delete Zotero[addon.data.config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  // Example factories in the upstream template still reference these dispatchers.
  onNotify: (..._args: any[]) => undefined,
  onShortcuts: (..._args: any[]) => undefined,
  onDialogEvents: (..._args: any[]) => undefined,
};
