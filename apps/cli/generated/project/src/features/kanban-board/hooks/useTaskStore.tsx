import * as Mod from '../../state-sync/store';
export * from '../../state-sync/store';
const _default = (Mod as any).default || (Mod as any)['useTaskStore'] || Mod[Object.keys(Mod)[0]] || Mod;
export default _default;
export { useTaskStore };