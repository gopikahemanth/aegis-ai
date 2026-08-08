import React from 'react';

export function types(props: any) {
  return <div className={props?.className || "types-stub"} {...props}>{props?.children || 'types'}</div>;
}
export const _comp_types = types;
export default types;

export type Types = any;
