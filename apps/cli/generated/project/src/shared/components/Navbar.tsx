import React from 'react';

export function Navbar(props: any) {
  return <div className={props?.className || "navbar-stub"} {...props}>{props?.children || 'Navbar'}</div>;
}
export const _comp_Navbar = Navbar;
export default Navbar;
