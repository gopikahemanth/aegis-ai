import React from 'react';

export function UploadPage(props: any) {
  return <div className={props?.className || "uploadpage-stub"} {...props}>{props?.children || 'UploadPage'}</div>;
}
export const _comp_UploadPage = UploadPage;
export default UploadPage;
