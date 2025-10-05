import { useState, useEffect } from 'react';

function GuidesTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Guides Test Page</h1>
      <p>If you can see this, the component is loading correctly.</p>
      <div>
        <h2>Debug Info:</h2>
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>
    </div>
  );
}

export default GuidesTest;