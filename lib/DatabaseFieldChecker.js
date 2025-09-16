// Create this as DatabaseFieldChecker.js to test what fields actually exist
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseFieldChecker = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const checkDatabaseFields = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔍 Checking database fields and constraints...', 'info');
      
      // Test 1: Check if we can read from tool_changes
      addResult('📋 Testing basic read access...', 'info');
      const { data: readTest, error: readError } = await supabase
        .from('tool_changes')
        .select('*')
        .limit(1);
      
      if (readError) {
        addResult(`❌ Read test failed: ${readError.message}`, 'error');
        throw readError;
      }
      
      if (readTest && readTest.length > 0) {
        addResult(`✅ Read test passed. Sample record fields: ${Object.keys(readTest[0]).join(', ')}`, 'success');
      } else {
        addResult('✅ Read test passed. Table is empty but accessible.', 'success');
      }
      
      // Test 2: Try inserting minimal record
      addResult('🎯 Testing minimal record insertion...', 'info');
      const minimalRecord = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        shift: 1,
        operator: 'TEST',
        created_at: new Date().toISOString()
      };
      
      addResult(`📦 Minimal record data: ${JSON.stringify(minimalRecord)}`, 'info');
      
      const { data: insertTest, error: insertError } = await supabase
        .from('tool_changes')
        .insert([minimalRecord])
        .select();
      
      if (insertError) {
        addResult(`❌ Minimal insert failed: ${insertError.message}`, 'error');
        addResult(`Error code: ${insertError.code}`, 'error');
        addResult(`Error details: ${insertError.details || 'None'}`, 'error');
        addResult(`Error hint: ${insertError.hint || 'None'}`, 'error');
      } else {
        addResult(`✅ Minimal insert successful! Record ID: ${insertTest[0].id}`, 'success');
        
        // Clean up the test record
        await supabase
          .from('tool_changes')
          .delete()
          .eq('id', insertTest[0].id);
        addResult('🧹 Test record cleaned up', 'info');
      }
      
      // Test 3: Try inserting with enhanced fields one by one
      const fieldsToTest = [
        'work_center',
        'equipment_number', 
        'operation',
        'part_number',
        'heat_number',
        'old_first_rougher',
        'new_first_rougher',
        'first_rougher_action',
        'material_appearance',
        'notes'
      ];
      
      addResult('🧪 Testing enhanced fields one by one...', 'info');
      
      for (const field of fieldsToTest) {
        const testRecord = {
          ...minimalRecord,
          [field]: field === 'shift' ? 1 : `test_${field}`
        };
        
        const { data: fieldTest, error: fieldError } = await supabase
          .from('tool_changes')
          .insert([testRecord])
          .select();
        
        if (fieldError) {
          addResult(`❌ Field '${field}' failed: ${fieldError.message}`, 'error');
        } else {
          addResult(`✅ Field '${field}' works`, 'success');
          // Clean up
          await supabase
            .from('tool_changes')
            .delete()
            .eq('id', fieldTest[0].id);
        }
      }
      
    } catch (error) {
      addResult(`❌ Unexpected error: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔍 Database Field Diagnostics
        </h1>
        
        <button
          onClick={checkDatabaseFields}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Testing Database...' : 'Run Database Field Tests'}
        </button>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-3">Test Results:</h3>
          
          {results.length === 0 && !loading && (
            <p className="text-gray-500 italic">Click the button above to run database field tests...</p>
          )}
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded text-sm font-mono ${
                result.type === 'error' 
                  ? 'bg-red-100 text-red-800' 
                  : result.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              <span className="text-xs text-gray-500">[{result.timestamp}]</span> {result.message}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">What This Test Does:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Tests basic database connectivity</li>
            <li>• Tries inserting minimal required fields</li>
            <li>• Tests each enhanced field individually</li>
            <li>• Shows exact error messages for troubleshooting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseFieldChecker;
