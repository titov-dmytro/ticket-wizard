import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { samplePackages } from './data/samplePackages';

function App() {
  return (
    <div className="App">
      <ChatInterface packages={samplePackages} />
    </div>
  );
}

export default App;
