import React from 'react';
export interface Artwork { id: string | number; title?: string; imageUrl?: string; price?: number; }
export const Layout: React.FC<any> = (props: any) => <div className="p-4" {...props}>{props?.children || 'Layout'}</div>;
export default Layout;
