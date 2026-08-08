import React from 'react';

export function Spinner(props: any) {
  return <div className={props?.className || "spinner-stub"} {...props}>{props?.children || 'Spinner'}</div>;
}
export const _comp_Spinner = Spinner;
export default Spinner;
