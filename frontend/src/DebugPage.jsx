import { useState, useEffect } from 'react';
import { utils, chatAPI, guidesAPI } from './utils/api';

function DebugPage() {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const runDebugChecks = async () => {
      const user = utils.getUser();
      const token = utils.getToken();
      
      setDebugInfo({
        user: user,
        hasToken: !!token,
        tokenValid: token ? 'Testing...' : 'No token',
        userRole: user?.role,
        userId: user?.id
      });

      // Test API calls
      const results = {};

      // Test guides API (public)
      try {
        const guidesResponse = await guidesAPI.getAllGuides();
        results.guides = { success: true, count: guidesResponse.guides?.length || 0 };
      } catch (error) {
        results.guides = { success: false, error: error.message };
      }

      // Test connected guides API (requires auth)
      try {
        const connectedResponse = await chatAPI.getConnectedGuides();
        results.connectedGuides = { success: true, ids: connectedResponse.connected_guide_ids };
      } catch (error) {
        results.connectedGuides = { success: false, error: error.message };
      }

      setTestResults(results);
    };

    runDebugChecks();
  }, []);

  const testConnect = async () => {
    try {
      const response = await chatAPI.startConversation(20); // Test with guide ID 20
      console.log('Test connect response:', response);
      setTestResults(prev => ({
        ...prev,
        testConnect: { success: true, response }
      }));
    } catch (error) {
      console.error('Test connect error:', error);
      setTestResults(prev => ({
        ...prev,
        testConnect: { success: false, error: error.message }
      }));
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Debug Information</h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>User Information</h2>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>API Test Results</h2>
        <pre>{JSON.stringify(testResults, null, 2)}</pre>
      </div>

      <button 
        onClick={testConnect}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Connect to Guide (ID: 20)
      </button>
    </div>
  );
}

export default DebugPage;