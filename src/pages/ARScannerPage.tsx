import React from 'react';
import Layout from '../components/Layout';

const ARScannerPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-infraeye-surface px-4">
        <h1 className="font-space-grotesk text-4xl font-bold text-infraeye-primary mb-4">
          AR Scanner
        </h1>
        <p className="font-inter text-xl text-infraeye-secondary">Coming Soon</p>
      </div>
    </Layout>
  );
};

export default ARScannerPage;
