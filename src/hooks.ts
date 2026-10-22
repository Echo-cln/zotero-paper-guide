import {
  openAssistantForCurrentReader,
  registerReaderAssistant,
} from "./modules/readerAssistant";

let unregisterReaderAssistant: (() => void) | undefined;
const menuItems = new Map<Window, Element>();

function onMainWindowLoad(win: Window) {
  const popup = win.document.querySelector("#menu_ToolsPopup");
  if (!popup || menuItems.has(win)) return;
  const item = win.document.createXULElement("menuitem");
  item.id = "paper-guide-tools-menuitem";
  item.setAttribute("label", "Paper Guide：论文带读与问答");
  item.setAttribute(
    "image",
    "chrome://paper-guide/content/icons/favicon@0.5x.png",
  );
  item.setAttribute("class", "menuitem-iconic");
  item.addEventListener("command", () => {
    if (!openAssistantForCurrentReader()) {
      win.alert("请先打开一篇 PDF 或 EPUB，再启动 Paper Guide。");
    }
  });
  popup.append(item);
  menuItems.set(win, item);
}

function onMainWindowUnload(win: Window) {
  menuItems.get(win)?.remove();
  menuItems.delete(win);
}

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  unregisterReaderAssistant = registerReaderAssistant();
  Zotero.getMainWindows().forEach((win) => onMainWindowLoad(win));
  addon.data.initialized = true;
}

function onShutdown() {
  unregisterReaderAssistant?.();
  unregisterReaderAssistant = undefined;
  [...menuItems.keys()].forEach((win) => onMainWindowUnload(win));
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
