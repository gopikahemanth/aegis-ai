import React from 'react';

export function AuthPage(props: any) {
  return <div className={props?.className || "authpage-stub"} {...props}>{props?.children || 'AuthPage'}</div>;
}
export const _comp_AuthPage = AuthPage;
export default AuthPage;
