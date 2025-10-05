import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simplified Guides component to test step by step
function GuidesSimple() {
  console.log('GuidesSimple component loading...');
  
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('GuidesSimple useEffect triggered');
    
    // Simple fetch without using our API utilities
    const fetchGuides = async () => {
      try {
        console.log('Fetching guides from API...');
        const response = await fetch('http://localhost:8080/api/guides');
        const data = await response.json();
        console.log('Guides data received:', data);
        
        setGuides(data.guides || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching guides:', error);
        setError('Failed to load guides: ' + error.message);
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  console.log('GuidesSimple render - loading:', loading, 'guides:', guides.length, 'error:', error);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading guides...</h2>
        <p>Please wait while we fetch the guides.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error Loading Guides</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px' }}>🎓 Connect with Guides</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Available Guides ({guides.length})</h2>
          
          {guides.length === 0 ? (
            <p>No guides available at the moment.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {guides.map((guide) => (
                <div
                  key={guide.id}
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                    {guide.name}
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '14px', margin: '0 0 15px 0' }}>
                    ID: {guide.id}
                  </p>
                  {guide.bio && (
                    <p style={{ color: '#495057', fontSize: '14px', margin: '0 0 15px 0' }}>
                      {guide.bio}
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      console.log('Connect clicked for guide:', guide);
                      
                      try {
                        // Make actual API call to start conversation
                        const response = await fetch('http://localhost:8080/api/chat/start', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({
                            guide_id: guide.id
                          })
                        });
                        
                        const result = await response.json();
                        console.log('Connect result:', result);
                        
                        if (response.ok) {
                          if (result.message === "Conversation already exists") {
                            alert(`✅ Already connected with ${guide.name}! Check your conversations.`);
                          } else {
                            alert(`🎉 Successfully connected with ${guide.name}!`);
                          }
                        } else {
                          alert(`❌ Failed to connect: ${result.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('Connect error:', error);
                        alert(`❌ Connection failed: ${error.message}`);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    💬 Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuidesSimple;