// components/ToolChangeForm.js - Simplified insert-focused version
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Wrench, Package, CheckCircle, Save, TrendingUp, RefreshCw } from 'lucide-react';
import { getEquipment, getToolInventory, getOperators, addToolChange } from '../lib/supabase';

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
    operator_employee_id: '',
    operator_clock_number: '',
    operator_id: null,

    // Machine/Operation Info - Pre-filled for CAT536-6763
    work_center: '',
    equipment_number: '',
    operation: 'Bore', // Auto-filled as requested
    part_number: 'CAT536-6763', // Auto-filled as requested
    job_number: '',

    // Simplified Tool Information - Insert tracking only
    old_first_rougher: '',
    new_first_rougher: '',
    first_rougher_action: '', // 'rotate' or 'new'
    
    old_finish_tool: '',
    new_finish_tool: '',
    finish_tool_action: '', // 'rotate' or 'new'

    // Simplified Change Details - Only change reason
    change_reason: '',
    notes: ''
  });

  const [toolInventory, setToolInventory] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Predefined lists
  const shifts = [1, 2, 3];

  const changeReasons = [
    'Normal Wear',
    'Chipped Edge', 
    'Tool Breakage',
    'Poor Finish',
    'Size Problems',
    'Scheduled Maintenance'
  ];

  const toolActions = [
    { value: 'rotate', label: 'Rotate Insert' },
    { value: 'new', label: 'New Insert' }
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
        const [tools, equipment, operatorsList] = await Promise.all([
          getToolInventory(),
          getEquipment(),
          getOperators()
        ]);
        setToolInventory(tools || []);
        setEquipmentList(equipment || []);
        setOperators(operatorsList || []);
        
        console.log('Data loaded:', {
          tools: tools?.length || 0,
          equipment: equipment?.length || 0,
          operators: operatorsList?.length || 0
        });
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

  const handleOperatorChange = (e) => {
    const selectedOperatorId = e.target.value;
    const selectedOperator = operators.find(op => op.id.toString() === selectedOperatorId);
    
    if (selectedOperator) {
      setFormData(prev => ({
        ...prev,
        operator: selectedOperator.full_name,
        operator_employee_id: selectedOperator.employee_id,
        operator_clock_number: selectedOperator.clock_number,
        operator_id: selectedOperator.id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        operator: '',
        operator_employee_id: '',
        operator_clock_number: '',
        operator_id: null
      }));
    }
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
      console.log('Starting form submission...');
      
      // Updated required fields validation - simplified
      const requiredFields = [
        'date', 'time', 'shift', 'operator_id', 'work_center', 
        'equipment_number', 'operation', 'part_number', 
        'old_first_rougher', 'new_first_rougher', 'first_rougher_action',
        'old_finish_tool', 'new_finish_tool', 'finish_tool_action',
        'change_reason'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare simplified data for database
      const cleanedData = {
        // Date and time fields
        date: formData.date,
        time: formData.time,
        shift: formData.shift ? Number(formData.shift) : null,
        
        // Operator information
        operator: formData.operator || null,
        operator_employee_id: formData.operator_employee_id || null,
        operator_clock_number: formData.operator_clock_number || null,
        operator_id: formData.operator_id || null,
        
        // Equipment and operation
        work_center: formData.work_center || null,
        equipment_number: formData.equipment_number || null,
        operation: formData.operation || null,
        part_number: formData.part_number || null,
        job_number: formData.job_number || null,
        
        // Simplified tool information - insert tracking
        old_first_rougher: formData.old_first_rougher || null,
        new_first_rougher: formData.new_first_rougher || null,
        first_rougher_action: formData.first_rougher_action || null,
        
        old_finish_tool: formData.old_finish_tool || null,
        new_finish_tool: formData.new_finish_tool || null,
        finish_tool_action: formData.finish_tool_action || null,
        
        // Simplified change details
        change_reason: formData.change_reason || null,
        notes: formData.notes || null,
        
        // Timestamp
        created_at: new Date().toISOString()
      };

      console.log('Submitting cleaned data:', cleanedData);

      const result = await addToolChange(cleanedData);
      
      console.log('Tool change saved successfully:', result);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          ...getCurrentDateTime(),
          operator: '',
          operator_employee_id: '',
          operator_clock_number: '',
          operator_id: null,
          work_center: '',
          equipment_number: '',
          operation: 'Bore', // Keep pre-filled
          part_number: 'CAT536-6763', // Keep pre-filled
          job_number: '',
          old_first_rougher: '',
          new_first_rougher: '',
          first_rougher_action: '',
          old_finish_tool: '',
          new_finish_tool: '',
          finish_tool_action: '',
          change_reason: '',
          notes: ''
        });
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving tool change:', error);
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
          <p className="text-gray-600">CAT536-6763 Insert Management System</p>
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

        {/* Basic Information */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator <span className="text-red-500">*</span>
              </label>
              <select
                name="operator"
                value={formData.operator_id || ''}
                onChange={handleOperatorChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select operator...</option>
                {operators.map(operator => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name} ({operator.employee_id}) - {operator.skill_level}
                    {operator.cat536_6763_experience && ' ⭐ CAT536 Certified'}
                  </option>
                ))}
              </select>
              
              {/* Show selected operator details */}
              {formData.operator_id && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span><strong>Clock #:</strong> {formData.operator_clock_number}</span>
                    <span><strong>Employee ID:</strong> {formData.operator_employee_id}</span>
                    {operators.find(op => op.id === formData.operator_id)?.cat536_6763_experience && (
                      <span className="col-span-2 text-green-600">
                        <strong>CAT536-6763 Experience:</strong> {
                          operators.find(op => op.id === formData.operator_id)?.cat536_6763_pieces_produced || 0
                        } pieces produced
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100"
                readOnly
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100"
                readOnly
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

        {/* Simplified Tool Information - Insert Tracking Only */}
        <div className="bg-purple-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            Insert Information
          </h2>
          
          {/* 1st Rougher Section */}
          <div className="mb-6 p-4 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">1st Rougher Insert</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Old 1st Rougher <span className="text-red-500">*</span>
                </label>
                <select
                  name="old_first_rougher"
                  value={formData.old_first_rougher}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select insert</option>
                  {toolInventory.filter(tool => tool.tool_type === 'Insert').map(tool => (
                    <option key={tool.tool_id} value={tool.tool_id}>
                      {tool.tool_id} - {tool.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New 1st Rougher <span className="text-red-500">*</span>
                </label>
                <select
                  name="new_first_rougher"
                  value={formData.new_first_rougher}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select insert</option>
                  {toolInventory.filter(tool => tool.tool_type === 'Insert').map(tool => (
                    <option key={tool.tool_id} value={tool.tool_id}>
                      {tool.tool_id} - {tool.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action <span className="text-red-500">*</span>
                </label>
                <select
                  name="first_rougher_action"
                  value={formData.first_rougher_action}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select action</option>
                  {toolActions.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Finishing Tool Section */}
          <div className="mb-4 p-4 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">Finishing Tool Insert</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Old Finishing Tool <span className="text-red-500">*</span>
                </label>
                <select
                  name="old_finish_tool"
                  value={formData.old_finish_tool}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select insert</option>
                  {toolInventory.filter(tool => tool.tool_type === 'Insert').map(tool => (
                    <option key={tool.tool_id} value={tool.tool_id}>
                      {tool.tool_id} - {tool.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Finishing Tool <span className="text-red-500">*</span>
                </label>
                <select
                  name="new_finish_tool"
                  value={formData.new_finish_tool}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select insert</option>
                  {toolInventory.filter(tool => tool.tool_type === 'Insert').map(tool => (
                    <option key={tool.tool_id} value={tool.tool_id}>
                      {tool.tool_id} - {tool.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action <span className="text-red-500">*</span>
                </label>
                <select
                  name="finish_tool_action"
                  value={formData.finish_tool_action}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select action</option>
                  {toolActions.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Change Details - Only Change Reason */}
        <div className="bg-yellow-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Change Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
              rows="3"
              placeholder="Additional comments about the insert change..."
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
              operator_employee_id: '',
              operator_clock_number: '',
              operator_id: null,
              work_center: '',
              equipment_number: '',
              operation: 'Bore',
              part_number: 'CAT536-6763',
              job_number: '',
              old_first_rougher: '',
              new_first_rougher: '',
              first_rougher_action: '',
              old_finish_tool: '',
              new_finish_tool: '',
              finish_tool_action: '',
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
            <span>{isSubmitting ? 'Saving to Database...' : 'Save Insert Change'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ToolChangeForm;
