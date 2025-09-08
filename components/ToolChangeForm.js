// components/ToolChangeForm.js - Spuncast Tool Change Tracking (Fixed)
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Wrench, Package, CheckCircle, Save, TrendingUp, RefreshCw } from 'lucide-react';
import { getEquipment, getToolInventory } from '../lib/supabase';

const ToolChangeForm = () => {
  // Auto-populate timestamp when form loads or QR code is scanned
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      shift: getShiftFromTime(now.getHours())
    };
  };

  // Determine shift based on current time
  const getShiftFromTime = (hour) => {
    if (hour >= 6 && hour < 14) return 1;  // 6 AM - 2 PM
    if (hour >= 14 && hour < 22) return 2; // 2 PM - 10 PM
    return 3; // 10 PM - 6 AM
  };

  const [formData, setFormData] = useState({
    // Basic Info - Auto-populated
    ...getCurrentDateTime(),
    operator: '',
    supervisor: '',

    // Machine/Operation Info
    work_center: '',
    equipment_number: '',
    operation: '',
    part_number: '',
    job_number: '',

    // Tool Information
    tool_type: '',
    old_tool_id: '',
    new_tool_id: '',
    tool_position: '',
    insert_type: '',
    insert_grade: '',

    // Change Details & Performance Impact
    change_reason: '',
    notes: ''
  });

  const [toolInventory, setToolInventory] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Function to refresh timestamp manually
  const refreshTimestamp = () => {
    const currentDateTime = getCurrentDateTime();
    setFormData(prev => ({
      ...prev,
      date: currentDateTime.date,
      time: currentDateTime.time,
      shift: currentDateTime.shift
    }));
  };

  // Auto-update timestamp whenever form is loaded (for QR code scanning)
  useEffect(() => {
    const updateCurrentTime = () => {
      const currentDateTime = getCurrentDateTime();
      setFormData(prev => ({
        ...prev,
        date: currentDateTime.date,
        time: currentDateTime.time,
        shift: currentDateTime.shift
      }));
    };

    updateCurrentTime();
    const timeInterval = setInterval(updateCurrentTime, 60000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateCurrentTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timeInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Extract equipment number from URL if coming from QR code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const equipmentParam = urlParams.get('equipment');
    const workCenterParam = urlParams.get('workcenter');

    if (equipmentParam) {
      setFormData(prev => ({
        ...prev,
        equipment_number: equipmentParam,
        work_center: workCenterParam || prev.work_center
      }));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tools, equipment] = await Promise.all([
          getToolInventory(),
          getEquipment()
        ]);
        setToolInventory(tools || []);
        setEquipmentList(equipment || []);
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };
    loadData();
  }, []);

  const handleEquipmentChange = (e) => {
    const number = e.target.value;
    setFormData(prev => ({ ...prev, equipment_number: number }));
    const eq = equipmentList.find(eq => eq.number === number);
    setFormData(prev => ({ ...prev, work_center: eq?.work_center || '' }));
  };

  const handleToolSelect = (e) => {
    const id = e.target.value;
    const tool = toolInventory.find(t => t.tool_id === id);
    setFormData(prev => ({
      ...prev,
      new_tool_id: id,
      tool_type: tool?.tool_type || '',
      insert_type: tool?.insert_type || '',
      insert_grade: tool?.insert_grade || ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = ['date', 'time', 'shift', 'operator', 'work_center', 'equipment_number', 'operation', 'part_number', 'tool_type', 'new_tool_id', 'change_reason'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare data for database (remove empty strings, convert to null)
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});

      // Submit to your backend API
      const response = await fetch('/api/tool-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // If using auth
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save tool change');
      }

      const result = await response.json();
      console.log('Tool change saved:', result);

      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          ...getCurrentDateTime(),
          operator: '',
          supervisor: '',
          work_center: '',
          equipment_number: '',
          operation: '',
          part_number: '',
          job_number: '',
          tool_type: '',
          old_tool_id: '',
          new_tool_id: '',
          tool_position: '',
          insert_type: '',
          insert_grade: '',
          change_reason: '',
          notes: ''
        });
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real equipment numbers from Spuncast facility

  const changeReasons = ['Tool Wear', 'Tool Breakage', 'Poor Surface Finish', 'Dimensional Issues', 'Chatter/Vibration', 'Setup Change', 'Scheduled Replacement', 'Programming Change', 'Quality Issue', 'Other'];
  const shifts = [1, 2, 3];
  const operations = ['Rough Turn', 'Finish Turn', 'Boring', 'Facing', 'Threading', 'Drilling', 'Milling', 'Grooving', 'Parting', 'Chamfering', 'Contouring', 'Deep Hole Drilling'];

  // Real operators from Spuncast production data
  const operators = [
    'Escobar, Ronald', 'Payne, Steven R.', 'Eggleston, Laura A', 'Anderson, Norah',
    'Jedrzejewski, Cody', 'Kersten, Paul', 'Gonzalez, Antonio', 'Ongino, Jasper',
    'Arellano, Manuel G.', 'Medina, Laura', 'Averill, Michael', 'Maule, Thomas P.',
    'Ruble, Andrew H', 'Contreras, Andres', 'Narvaez, Cristian', 'Fuller, Jordan',
    'Lucht, Joel R.', 'Fuiten, Keri A'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Spuncast Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-900">SPUNCAST</h1>
            <p className="text-sm text-gray-600">W4493 Shine Road, Watertown, WI 53098</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tool Change Performance Tracking</h2>
        <p className="text-gray-600">Optimize throughput, quality, and equipment effectiveness</p>
      </div>

      {submitStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          submitStatus === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>
            {submitStatus === 'success' 
              ? 'Tool change saved to database! Data available for analysis.' 
              : 'Error saving to database. Please check required fields and try again.'}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={refreshTimestamp}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Refresh to current time"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {shifts.map(shift => (
                  <option key={shift} value={shift}>Shift {shift}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator <span className="text-red-500">*</span>
              </label>
              <select
                name="operator"
                value={formData.operator}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select operator</option>
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleInputChange}
                placeholder="Supervisor name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Equipment & Operation Information */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <Wrench className="mr-2" size={20} />
            Equipment & Operation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Center</label>
              <input
                type="text"
                name="work_center"
                value={formData.work_center}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Number <span className="text-red-500">*</span>
              </label>
              <select
                name="equipment_number"
                value={formData.equipment_number}
                onChange={handleEquipmentChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select equipment</option>
                {equipmentList.map(eq => (
                  <option key={eq.number} value={eq.number}>
                    {eq.number} - {eq.description} ({eq.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation <span className="text-red-500">*</span>
              </label>
              <select
                name="operation"
                value={formData.operation}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select operation</option>
                {operations.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                required
                placeholder="Part being machined"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
              <input
                type="text"
                name="job_number"
                value={formData.job_number}
                onChange={handleInputChange}
                placeholder="Work order number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Tool Information */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            Tool Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tool Type</label>
              <input
                type="text"
                name="tool_type"
                value={formData.tool_type}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old Tool ID</label>
              <input
                type="text"
                name="old_tool_id"
                value={formData.old_tool_id}
                onChange={handleInputChange}
                placeholder="Tool being removed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Tool ID <span className="text-red-500">*</span>
              </label>
              <select
                name="new_tool_id"
                value={formData.new_tool_id}
                onChange={handleToolSelect}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select tool</option>
                {toolInventory.map(tool => (
                  <option key={tool.tool_id} value={tool.tool_id}>
                    {tool.tool_id} - {tool.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tool Position</label>
              <input
                type="text"
                name="tool_position"
                value={formData.tool_position}
                onChange={handleInputChange}
                placeholder="e.g., T01, T02, Station 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insert Type</label>
              <input
                type="text"
                name="insert_type"
                value={formData.insert_type}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insert Grade</label>
              <input
                type="text"
                name="insert_grade"
                value={formData.insert_grade}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Performance & Quality Impact */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Performance & Quality Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Reason <span className="text-red-500">*</span>
              </label>
              <select
                name="change_reason"
                value={formData.change_reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select reason</option>
                {changeReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Link href="/additional-data" className="text-blue-600 underline">
                Provide additional performance data
              </Link>
            </div>
          </div>
        </div>


        {/* Additional Notes */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
            <CheckCircle className="mr-2" size={20} />
            Notes
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes & Observations</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any additional observations, machine conditions, setup issues, recommendations for improvement, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({
              ...getCurrentDateTime(),
              operator: '',
              supervisor: '',
              work_center: '',
              equipment_number: '',
              operation: '',
              part_number: '',
              job_number: '',
              tool_type: '',
              old_tool_id: '',
              new_tool_id: '',
              tool_position: '',
              insert_type: '',
              insert_grade: '',
              change_reason: '',
              notes: ''
            })}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Form
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={20} />
            <span>{isSubmitting ? 'Saving to Database...' : 'Save Tool Change'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ToolChangeForm;
