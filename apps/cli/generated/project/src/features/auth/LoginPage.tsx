import React from 'react';

export function LoginPage(props: any) {
  return <div className={props?.className || "loginpage-stub"} {...props}>{props?.children || 'LoginPage'}</div>;
}
export const _comp_LoginPage = LoginPage;
export default LoginPage;
