import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { buttonVariants } from './components/ui/Button';
import UISample from './pages/UISample';

function HomePage() {
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-primary">BlueMoon AMS</h1>
        <p className="text-lg text-muted-foreground">Apartment Management System</p>
        <Link className={buttonVariants({ variant: 'default' })} to="/uisample">
          Xem sample o day
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/uisample" element={<UISample />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
