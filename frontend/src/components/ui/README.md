## UI Components — Usage Guide

Dùng cái trang UISample.jsx để xem cách dùng cho dễ, cái này làm để đầy đủ yêu cầu


**Where to look**:
- **Button**: [frontend/src/components/ui/Button.jsx](frontend/src/components/ui/Button.jsx)
- **TopBar**: [frontend/src/components/ui/TopBar.jsx](frontend/src/components/ui/TopBar.jsx)
- **Toast**: [frontend/src/components/ui/Toast.jsx](frontend/src/components/ui/Toast.jsx)
- **Modal**: [frontend/src/components/ui/Modal.jsx](frontend/src/components/ui/Modal.jsx)
- **PresenceTransition**: [frontend/src/components/ui/PresenceTransition.jsx](frontend/src/components/ui/PresenceTransition.jsx)

**Import note**: adjust relative paths depending on where you call the component from. Examples below use local imports for clarity.

**Examples**

- **Button**: variants and sizes

```jsx
import { Button } from './Button';

function Example() {
  return (
    <div className="space-x-2">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="sm">Small</Button>
      <Button variant="icon-circle" aria-label="Open">
        {/* icon */}
      </Button>
    </div>
  );
}
```

- **TopBar**: props and basic usage

`TopBar` expects two props:
- `onToggleSidebar`: callback when the sidebar-toggle button is pressed
- `sidebarOpen`: boolean state to indicate whether the sidebar is open

```jsx
import TopBar from './TopBar';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <TopBar onToggleSidebar={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />;
}
```

- **Modal**: controlled open state pattern

```jsx
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';

function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalHeader>Confirm</ModalHeader>
        <ModalBody>Are you sure?</ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {/* action */}}>Confirm</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

- **Toast**: ephemeral notifications

The `Toast` component is controlled by an `open` prop and an `onOpenChange` callback. Use local state to show/hide toasts.

```jsx
import { Toast } from './Toast';
import { Button } from './Button';

function ToastDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show success</Button>
      <Toast open={open} onOpenChange={setOpen} variant="success" title="Saved" description="Your changes were saved." />
    </>
  );
}
```

- **PresenceTransition**: shared animation wrapper

`PresenceTransition` accepts an `open` boolean and renders a function child with `{ isOpen }` so you can animate transitions consistently.

```jsx
import PresenceTransition from './PresenceTransition';

<PresenceTransition open={isOpen} exitDuration={250}>
  {({ isOpen }) => (
    <div className={isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}>Content</div>
  )}
</PresenceTransition>
```

Tips & conventions:
- Components use Tailwind token classes (see global CSS variables). Prefer the provided variants (e.g., `variant="outline"`).
- Most overlay/ephemeral primitives are controlled (they accept `open` + `onOpenChange`) — keep a single source of truth in parent state.
- When in doubt, open `frontend/src/pages/UISample.jsx` for working examples of the components used together.

If you want, I can add small Storybook stories or a live example page to make these examples interactive for the team.
# UI Components

Nhớ dùng các components trong folder này (như các buttons, inputs,...) Tham khảo link Figma để biết chi tiết cách xử dụng các loại components cũng như quy định về chữ cái, và màu sắc: 
https://www.figma.com/design/eubRGiKU7W31dpGfZdqbPG/trung.nq2416756-s-team-library?node-id=3345-484&t=93OR4TYt1S0RufiI-1


## Dark/Light Mode

The app automatically switches between dark and light modes using the `.dark` and `.light` classes on the root element.

```jsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

