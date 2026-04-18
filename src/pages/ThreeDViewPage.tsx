import React from 'react';
import Navbar from '../components/Navbar';

const ThreeDViewPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div style={{ width: '100%', height: 'calc(100vh - 80px)', margin: 0, padding: 0, overflow: 'hidden' }}>
        <iframe
          src="http://localhost:5177"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          title="3D City Visualization"
          allowFullScreen
        />
      </div>
    </>
  );
};

export default ThreeDViewPage;
