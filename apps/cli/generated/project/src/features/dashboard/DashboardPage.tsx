import React from 'react';

export function DashboardPage(props: any) {
  return <div className={props?.className || "dashboardpage-stub"} {...props}>{props?.children || 'DashboardPage'}</div>;
}
export const _comp_DashboardPage = DashboardPage;
export default DashboardPage;
