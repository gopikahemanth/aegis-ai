import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../shared/components/Layout';
import { Spinner } from '../shared/components/Spinner';

const Gallery = lazy(() => import('../features/gallery-filtering/GalleryPage'));
const Admin = lazy(() => import('../features/artwork-management/AdminPage'));

export const App = () => (
  <BrowserRouter>
    <Layout>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </Layout>
  </BrowserRouter>
);

export default App;
