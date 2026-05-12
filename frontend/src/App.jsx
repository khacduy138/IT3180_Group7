import React from 'react';

import BillingPage from './pages/billing/BillingPage';

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>BlueMoon AMS</h1>
        <p style={{ marginTop: 4 }}>Apartment Management System</p>
        <p style={{ marginTop: 4 }}>
          Module: <strong>M4 - Billing</strong>
        </p>
      </header>

      <main>
        <BillingPage />
      </main>
    </div>
  );
}
