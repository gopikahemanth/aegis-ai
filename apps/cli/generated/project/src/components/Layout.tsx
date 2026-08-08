import React from 'react';

export function Layout(props: any) {
  return <div className={props?.className || "layout-stub"} {...props}>{props?.children || 'Layout'}</div>;
}
export const _comp_Layout = Layout;
export default Layout;
