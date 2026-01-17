/* SystemJS module definition */
declare const nodeModule: NodeModule;
interface NodeModule {
  id: string;
}
interface Window {
  electron?: {
    ipcRenderer?: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    };
    fs?: any;
    os?: any;
    childProcess?: any;
    process?: { cwd: () => string };
    webFrame?: any;
  };
}

declare var $: any;
declare var jQuery: any;
