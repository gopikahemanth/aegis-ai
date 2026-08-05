import React from 'react';
export interface Artwork { id: string | number; title?: string; imageUrl?: string; price?: number; }
export const Spinner: React.FC<any> = (props: any) => <div className="p-4" {...props}>{props?.children || 'Spinner'}</div>;
export default Spinner;
