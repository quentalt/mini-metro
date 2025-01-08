import React from 'react';
import { Train } from 'lucide-react';
import Sketch from './components/Sketch';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Train className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Mini Metro Clone</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Sketch />
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">How to play:</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Click on a station to start a new line</li>
              <li>Drag to connect to other stations</li>
              <li>Trains automatically move along the lines</li>
              <li>Trains pick up passengers and drop them at matching stations</li>
              <li>Each train can carry up to 4 passengers</li>
              <li>Score points by delivering passengers to their destinations</li>
              <li>New stations appear every 5 days</li>
              <li>Game over if 3 stations overflow with passengers!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

