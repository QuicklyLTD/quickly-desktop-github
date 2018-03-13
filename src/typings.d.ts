declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}
declare var window: Window;
interface Window {
  process: any;
  require: any;
}
declare module 'PouchDB' {
  namespace PouchDB { }
  export = PouchDB;
}
declare var $: any;
declare var printer: any;
declare module '*';