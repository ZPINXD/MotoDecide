import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Beranda from './pages/Beranda.jsx';
import KatalogMotor from './pages/KatalogMotor.jsx';
import Kuesioner from './pages/Kuesioner.jsx';
import Filter from './pages/Filter.jsx';
import Hasil from './pages/Hasil.jsx';
import DetailMotor from './pages/DetailMotor.jsx';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/katalog" element={<KatalogMotor />} />
        <Route path="/motor" element={<Navigate to="/katalog" replace />} />
        <Route path="/kuesioner" element={<Kuesioner />} />
        <Route path="/filter" element={<Filter />} />
        <Route path="/hasil" element={<Hasil />} />
        <Route path="/motor/:id" element={<DetailMotor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        <div className="container">
          SPK Pemilihan Motor Bekas — Metode AHP & WP © {new Date().getFullYear()}
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default App;
