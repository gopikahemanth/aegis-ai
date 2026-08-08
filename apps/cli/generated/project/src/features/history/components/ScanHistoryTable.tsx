import React from 'react';

export function ScanHistoryTable(props: any) {
  return <div className={props?.className || "scanhistorytable-stub"} {...props}>{props?.children || 'ScanHistoryTable'}</div>;
}
export const _comp_ScanHistoryTable = ScanHistoryTable;
export default ScanHistoryTable;
