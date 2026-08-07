import * as Mod from '../../design-system/components/Skeleton';
export * from '../../design-system/components/Skeleton';
const _default = (Mod as any).default || (Mod as any)['Skeleton'] || Mod[Object.keys(Mod)[0]] || Mod;
export default _default;

export const Skeleton: any = (props: any) => <div className="skeleton-shim" {...props}>{props?.children}</div>;
