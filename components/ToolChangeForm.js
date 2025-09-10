// components/ToolChangeForm.js - Updated per requirements
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Wrench, Package, CheckCircle, Save, TrendingUp, RefreshCw } from 'lucide-react';
import { getEquipment, getToolInventory, addToolChange } from '../lib/supabase';

const ToolChangeForm = () => {
  // Auto-populate timestamp when form loads
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

    // Machine/Operation Info
    work_center: '',
    equipment_number: '',
    operation: '',
    part_number: '',
    job_number: '',

    // Tool Information - Updated structure
    old_tool_id: '',
    new_tool_id: '',
    tool_position: '',
    first_rougher: '',  // New field for 1st Rougher insert
    finish_tool: '',    // New field for Finish Tool insert
    insert_type: '',
    insert_grade: '',

    // Change Details & Performance Impact
    change_reason: '',
    old_tool_condition: '',
    pieces_produced: '',
    cycle_time_before: '',
    cycle_time_after: '',
    downtime_minutes: '',
    notes: ''
  });

  const [toolInventory, setToolInventory] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Predefined lists
  const shifts = [1, 2, 3];
  const operators = [
    'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 
    'Tom Rodriguez', 'Lisa Chen', 'Dave Brown', 'Amy Garcia',
    'Chris Lee', 'Maria Gonzalez'
  ];

  // Insert options for dropdowns - organized by type
  const rougherInserts = [
    'CNMG-432',
    'CNMG-433', 
    'DNMG-432',
    'DNMG-433',
    'TNMG-432',
    'TNMG-433',
    'VNMG-432',
    'VNMG-433'
  ];

  const finishInserts = [
    'CCMT-321',
    'CCMT-432',
    'DCMT-321', 
    'DCMT-432',
    'TCMT-321',
    'TCMT-432',
    'VCMT-321',
    'VCMT-432'
  ];

  const changeReasons = [
    'Normal Wear',
    'Chipped Edge', 
    'Tool Breakage',
    'Poor Finish',
    'Size Problems',
    'Scheduled Maintenance'
  ];

  const toolConditions = [
    'Good',
    'Fair', 
    'Poor',
    'Broken',
    'Chipped',
    'Worn'
  ];

  // Load equipment data from QR scanning or manual selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const equipment = urlParams.get('equipment');
      const workCenter = urlParams.get('work_center');
      
      setFormData(prev => ({
        ...prev,
        equipment_number: equipment || prev.equipment_number,
        work_center: workCenter || prev.work_center
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
    const eq = equipmentList.find(eq => eq.equipment_number === number);
    setFormData(prev => ({ 
      ...prev, 
      work_center: eq?.work_center || '' 
    }));
  };

  const handleToolSelect = (e) => {
    const id = e.target.value;
    const tool = toolInventory.find(t => t.tool_id === id);
    setFormData(prev => ({
      ...prev,
      new_tool_id: id,
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
    setSubmitStatus(null);
    
    try {
      console.log('🚀 Starting form submission...');
      
      // Validate required fields - updated to exclude supervisor and tool_type
      const requiredFields = [
        'date', 'time', 'shift', 'operator', 'work_center', 
        'equipment_number', 'operation', 'part_number', 'change_reason'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare data for database (clean up empty strings and format properly)
      const cleanedData = {
        // Date and time fields
        date: formData.date,
        time: formData.time,
        shift: formData.shift ? Number(formData.shift) : null,
        
        // People - supervisor removed
        operator: formData.operator || null,
        
        // Equipment and operation
        work_center: formData.work_center || null,
        equipment_number: formData.equipment_number || null,
        operation: formData.operation || null,
        part_number: formData.part_number || null,
        job_number: formData.job_number || null,
        
        // Tool information - tool_type removed, new fields added
        old_tool_id: formData.old_tool_id || null,
        new_tool_id: formData.new_tool_id || null,
        tool_position: formData.tool_position || null,
        first_rougher: formData.first_rougher || null,     // New field
        finish_tool: formData.finish_tool || null,         // New field
        insert_type: formData.insert_type || null,
        insert_grade: formData.insert_grade || null,
        
        // Change details
        change_reason: formData.change_reason || null,
        old_tool_condition: formData.old_tool_condition || null,
        pieces_produced: formData.pieces_produced ? Number(formData.pieces_produced) : null,
        cycle_time_before: formData.cycle_time_before ? Number(formData.cycle_time_before) : null,
        cycle_time_after: formData.cycle_time_after ? Number(formData.cycle_time_after) : null,
        downtime_minutes: formData.downtime_minutes ? Number(formData.downtime_minutes) : null,
        notes: formData.notes || null,
        
        // Add timestamp
        created_at: new Date().toISOString()
      };

      console.log('📋 Submitting cleaned data:', cleanedData);

      // Submit directly to Supabase using your addToolChange function
      const result = await addToolChange(cleanedData);
      
      console.log('✅ Tool change saved successfully:', result);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          ...getCurrentDateTime(),
          operator: '',
          work_center: '',
          equipment_number: '',
          operation: '',
          part_number: '',
          job_number: '',
          old_tool_id: '',
          new_tool_id: '',
          tool_position: '',
          first_rougher: '',
          finish_tool: '',
          insert_type: '',
          insert_grade: '',
          change_reason: '',
          old_tool_condition: '',
          pieces_produced: '',
          cycle_time_before: '',
          cycle_time_after: '',
          downtime_minutes: '',
          notes: ''
        });
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error saving tool change:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Tool Change Tracking</h1>
          <p className="text-gray-600">Manufacturing Optimization System</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="mr-2" size={20} />
            Tool change recorded successfully!
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Error saving tool change. Please try again.
          </div>
        )}

        {/* Basic Information - Supervisor removed */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            {/* Supervisor field removed per requirements */}
          </div>
        </div>

        {/* Equipment & Operation Information */}
        <div className="bg-green-50 p-6 rounded-lg mb-6">
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
                onChange={handleInputChange}
                placeholder="e.g., WC100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <option key={eq.equipment_number} value={eq.equipment_number}>
                    {eq.equipment_number} - {eq.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="operation"
                value={formData.operation}
                onChange={handleInputChange}
                placeholder="e.g., Rough Turn, Finish Mill"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                placeholder="e.g., CAT123-456"
                required
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
                placeholder="e.g., JOB-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Tool Information - Updated with new insert fields */}
        <div className="bg-purple-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            Tool Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old Tool ID</label>
              <input
                type="text"
                name="old_tool_id"
                value={formData.old_tool_id}
                onChange={handleInputChange}
                placeholder="e.g., T01-OLD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Tool ID</label>
              <select
                name="new_tool_id"
                value={formData.new_tool_id}
                onChange={handleToolSelect}
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
          </div>
          
          {/* New insert fields per requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1st Rougher <span className="text-red-500">*</span>
              </label>
              <select
                name="first_rougher"
                value={formData.first_rougher}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select rougher insert</option>
                {rougherInserts.map(insert => (
                  <option key={insert} value={insert}>{insert}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish Tool <span className="text-red-500">*</span>
              </label>
              <select
                name="finish_tool"
                value={formData.finish_tool}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select finish insert</option>
                {finishInserts.map(insert => (
                  <option key={insert} value={insert}>{insert}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insert Type</label>
              <input
                type="text"
                name="insert_type"
                value={formData.insert_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insert Grade</label>
              <input
                type="text"
                name="insert_grade"
                value={formData.insert_grade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Change Reason & Performance */}
        <div className="bg-yellow-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Change Details & Performance Impact
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old Tool Condition</label>
              <select
                name="old_tool_condition"
                value={formData.old_tool_condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select condition</option>
                {toolConditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pieces Produced</label>
              <input
                type="number"
                name="pieces_produced"
                value={formData.pieces_produced}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Time Before (sec)</label>
              <input
                type="number"
                name="cycle_time_before"
                value={formData.cycle_time_before}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Time After (sec)</label>
              <input
                type="number"
                name="cycle_time_after"
                value={formData.cycle_time_after}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (minutes)</label>
              <input
                type="number"
                name="downtime_minutes"
                value={formData.downtime_minutes}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              placeholder="Additional comments about the tool change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({
              ...getCurrentDateTime(),
              operator: '',
              work_center: '',
              equipment_number: '',
              operation: '',
              part_number: '',
              job_number: '',
              old_tool_id: '',
              new_tool_id: '',
              tool_position: '',
              first_rougher: '',
              finish_tool: '',
              insert_type: '',
              insert_grade: '',
              change_reason: '',
              old_tool_condition: '',
              pieces_produced: '',
              cycle_time_before: '',
              cycle_time_after: '',
              downtime_minutes: '',
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
