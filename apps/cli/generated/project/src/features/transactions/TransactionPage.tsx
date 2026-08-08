import React from 'react';

export function TransactionPage(props: any) {
  return <div className={props?.className || "transactionpage-stub"} {...props}>{props?.children || 'TransactionPage'}</div>;
}
export const _comp_TransactionPage = TransactionPage;
export default TransactionPage;
