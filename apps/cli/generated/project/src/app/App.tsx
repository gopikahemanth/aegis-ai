import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { GalleryPage } from '@/features/gallery-discovery/components/GalleryPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}