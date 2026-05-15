import { Button } from './components/ui/Button';
import { Home } from 'lucide-react';

function App() {
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">BlueMoon AMS</h1>
        <p className="text-lg text-muted-foreground mb-8">Apartment Management System</p>
        <div className="flex flex-wrap gap-4">
        <Button variant="default">Test Button</Button>
        <Button variant="outline" className="ml-2">Outline Button</Button>
        <Button variant="subtle" className="ml-2">Subtle Button</Button>
        <Button variant="destructive" className="ml-2">Destructive Button</Button>  
        <Button variant="link" className="ml-2">Link Button</Button>
        <Button variant="with-icon" className="ml-2">
          <Home className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
