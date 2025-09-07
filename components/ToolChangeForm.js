// components/ToolChangeForm.js - Spuncast Tool Change Tracking (Fixed)
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Wrench, Package, AlertCircle, CheckCircle, Save, TrendingUp, Target, Zap, RefreshCw } from 'lucide-react';

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
    old_tool_condition: '',
    pieces_produced: '',
    cycle_time_before: '',
    cycle_time_after: '',
    
    // Quality & Throughput Metrics
    dimension_check: '',
    surface_finish: '',
    scrap_pieces: '',
    rework_pieces: '',
    downtime_minutes: '',
    
    // Improvement Tracking
    tool_life_expected: '',
    tool_life_actual: '',
    feeds_speeds_changed: '',
    coolant_condition: '',
    
    // Root Cause & Actions
    failure_mode: '',
    corrective_action: '',
    notes: ''
  });

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
          old_tool_condition: '',
          pieces_produced: '',
          cycle_time_before: '',
          cycle_time_after: '',
          dimension_check: '',
          surface_finish: '',
          scrap_pieces: '',
          rework_pieces: '',
          downtime_minutes: '',
          tool_life_expected: '',
          tool_life_actual: '',
          feeds_speeds_changed: '',
          coolant_condition: '',
          failure_mode: '',
          corrective_action: '',
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
  const equipmentNumbers = [
    // CNC Lathes - Modern Doosan PUMA Series
    { number: '1689', description: 'DOOSAN PUMA 2600SY', type: 'CNC Lathe' },
    { number: '1717', description: 'DOOSAN PUMA 5100LYB', type: 'CNC Lathe' },
    { number: '1747', description: 'DOOSAN PUMA (Large)', type: 'CNC Lathe' },
    { number: '1759', description: 'DOOSAN PUMA 4100LB', type: 'CNC Lathe' },
    { number: '1760', description: 'DOOSAN PUMA 3100XLY', type: 'CNC Lathe' },
    { number: '1770', description: 'DOOSAN PUMA 5100B #1', type: 'CNC Lathe' },
    { number: '1771', description: 'DOOSAN PUMA 5100B #2', type: 'CNC Lathe' },
    { number: '1781', description: 'CLAUSING CL 35160', type: 'CNC Lathe' },
    
    // CNC Lathes - Cincinnati Series
    { number: '1405', description: 'CNC CRAWFORD', type: 'CNC Lathe' },
    { number: '1411', description: 'CINCINNATI 18U060', type: 'CNC Lathe' },
    { number: '1419', description: 'CINCINNATI 21U100', type: 'CNC Lathe' },
    { number: '1473', description: 'CNC 24U', type: 'CNC Lathe' },
    { number: '1528', description: 'MAZAK CNC', type: 'CNC Lathe' },
    { number: '1531', description: 'CNC 18U UNIV', type: 'CNC Lathe' },
    { number: '1549', description: 'CINCINNATI 28U', type: 'CNC Lathe' },
    { number: '1577', description: 'CINCINNATI 24U TWIN DISC', type: 'CNC Lathe' },
    { number: '1681', description: 'CINTURN 28U (29U)', type: 'CNC Lathe' },
    
    // Boring Machines
    { number: '1254', description: 'LEBLOND BORING #1', type: 'Boring Machine' },
    { number: '1340', description: 'NILES BORING #2', type: 'Boring Machine' },
    { number: '1383', description: 'NILES BORING #3', type: 'Boring Machine' },
    { number: '1389', description: 'LEBLOND DEEP HOLE #3', type: 'Boring Machine' },
    { number: '1491', description: 'LEBLOND DANILUK', type: 'Boring Machine' },
    { number: '1548', description: 'WOHLENBERG BORING', type: 'Boring Machine' },
    { number: '1585', description: 'LEBLOND BORING', type: 'Boring Machine' },
    { number: '1625', description: 'SINGLE PASS DEEP HOLE', type: 'Boring Machine' },
    { number: '1727', description: 'GISHOLT 5L TURRET', type: 'Boring Machine' },
    
    // Mills
    { number: '1521', description: 'BRIDGEPORT VERTICAL', type: 'Mill' },
    { number: '1631', description: 'MILACRON HORIZONTAL', type: 'CNC Mill' },
    { number: '1690', description: 'DOOSAN PUMA VERTICAL', type: 'CNC Mill' },
    
    // Manual/Other
    { number: '1329', description: 'POREBA ENGINE #4', type: 'Manual Lathe' },
    { number: '1394', description: 'LION ENGINE', type: 'Manual Lathe' },
    { number: '1492', description: 'MONARCH TURN', type: 'Manual Lathe' },
    { number: '1624', description: 'DAEWOO LATHE', type: 'CNC Lathe' }
  ];

  const toolTypes = ['Carbide Insert', 'Drill Bit', 'End Mill', 'Face Mill', 'Boring Bar', 'Tap', 'Reamer', 'Threading Tool', 'Grooving Tool', 'Parting Tool', 'Other'];
  const insertTypes = ['CNMG', 'SNMG', 'TNMG', 'WNMG', 'RCMT', 'DNMG', 'VCMT', 'CCMT', 'CCGT', 'DCMT', 'TNMC', 'CNMC', 'Other'];
  const changeReasons = ['Tool Wear', 'Tool Breakage', 'Poor Surface Finish', 'Dimensional Issues', 'Chatter/Vibration', 'Setup Change', 'Scheduled Replacement', 'Programming Change', 'Quality Issue', 'Other'];
  const toolConditions = ['Normal Wear', 'Excessive Wear', 'Chipped Edge', 'Broken', 'Built-up Edge', 'Crater Wear', 'Flank Wear', 'Thermal Damage', 'Other'];
  const shifts = [1, 2, 3];
  const workCenters = ['010', '040', '202', '203', '204', '205', '259'];
  const operations = ['Rough Turn', 'Finish Turn', 'Boring', 'Facing', 'Threading', 'Drilling', 'Milling', 'Grooving', 'Parting', 'Chamfering', 'Contouring', 'Deep Hole Drilling'];
  const failureModes = ['Gradual Wear', 'Sudden Fracture', 'Edge Chipping', 'Thermal Damage', 'Adhesive Wear', 'Abrasive Wear', 'Fatigue Failure', 'Built-up Edge', 'Oxidation', 'Other'];
  const coolantConditions = ['Good', 'Contaminated', 'Low Flow', 'Wrong Type', 'None Used', 'Needs Change', 'Too Hot', 'Poor Quality'];

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Center <span className="text-red-500">*</span>
              </label>
              <select
                name="work_center"
                value={formData.work_center}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select work center</option>
                {workCenters.map(wc => (
                  <option key={wc} value={wc}>{wc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Number <span className="text-red-500">*</span>
              </label>
              <select
                name="equipment_number"
                value={formData.equipment_number}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select equipment</option>
                {equipmentNumbers.map(eq => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tool Type <span className="text-red-500">*</span>
              </label>
              <select
                name="tool_type"
                value={formData.tool_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select tool type</option>
                {toolTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
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
              <input
                type="text"
                name="new_tool_id"
                value={formData.new_tool_id}
                onChange={handleInputChange}
                required
                placeholder="Tool being installed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
              <select
                name="insert_type"
                value={formData.insert_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select insert type</option>
                {insertTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insert Grade</label>
              <input
                type="text"
                name="insert_grade"
                value={formData.insert_grade}
                onChange={handleInputChange}
                placeholder="e.g., AH120, T9025, IC807"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failure Mode</label>
              <select
                name="failure_mode"
                value={formData.failure_mode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select failure mode</option>
                {failureModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pieces Produced</label>
              <input
                type="number"
                name="pieces_produced"
                value={formData.pieces_produced}
                onChange={handleInputChange}
                placeholder="Parts made with old tool"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scrap Pieces</label>
              <input
                type="number"
                name="scrap_pieces"
                value={formData.scrap_pieces}
                onChange={handleInputChange}
                placeholder="Parts scrapped due to tool"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rework Pieces</label>
              <input
                type="number"
                name="rework_pieces"
                value={formData.rework_pieces}
                onChange={handleInputChange}
                placeholder="Parts requiring rework"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Throughput Optimization */}
        <div className="bg-indigo-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Throughput & Efficiency Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Time Before (min)</label>
              <input
                type="number"
                step="0.1"
                name="cycle_time_before"
                value={formData.cycle_time_before}
                onChange={handleInputChange}
                placeholder="Cycle time with old tool"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Time After (min)</label>
              <input
                type="number"
                step="0.1"
                name="cycle_time_after"
                value={formData.cycle_time_after}
                onChange={handleInputChange}
                placeholder="Cycle time with new tool"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (minutes)</label>
              <input
                type="number"
                name="downtime_minutes"
                value={formData.downtime_minutes}
                onChange={handleInputChange}
                placeholder="Machine downtime for change"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Tool Life</label>
              <input
                type="number"
                name="tool_life_expected"
                value={formData.tool_life_expected}
                onChange={handleInputChange}
                placeholder="Expected pieces"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Tool Life</label>
              <input
                type="number"
                name="tool_life_actual"
                value={formData.tool_life_actual}
                onChange={handleInputChange}
                placeholder="Actual pieces produced"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feeds/Speeds Changed?</label>
              <select
                name="feeds_speeds_changed"
                value={formData.feeds_speeds_changed}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Process Optimization */}
        <div className="bg-orange-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center">
            <Zap className="mr-2" size={20} />
            Process & Quality Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coolant Condition</label>
              <select
                name="coolant_condition"
                value={formData.coolant_condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select condition</option>
                {coolantConditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimension Check</label>
              <input
                type="text"
                name="dimension_check"
                value={formData.dimension_check}
                onChange={handleInputChange}
                placeholder="Within tolerance, +0.001, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surface Finish</label>
              <input
                type="text"
                name="surface_finish"
                value={formData.surface_finish}
                onChange={handleInputChange}
                placeholder="e.g., 63 Ra, Good, Poor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Root Cause & Corrective Actions */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
            <AlertCircle className="mr-2" size={20} />
            Root Cause & Corrective Actions
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken</label>
              <textarea
                name="corrective_action"
                value={formData.corrective_action}
                onChange={handleInputChange}
                rows="3"
                placeholder="What actions were taken to prevent this issue from recurring? (e.g., changed feeds/speeds, improved coolant flow, better tool selection, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
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
              old_tool_condition: '',
              pieces_produced: '',
              cycle_time_before: '',
              cycle_time_after: '',
              dimension_check: '',
              surface_finish: '',
              scrap_pieces: '',
              rework_pieces: '',
              downtime_minutes: '',
              tool_life_expected: '',
              tool_life_actual: '',
              feeds_speeds_changed: '',
              coolant_condition: '',
              failure_mode: '',
              corrective_action: '',
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

        {/* Performance Impact Summary */}
        {(formData.cycle_time_before && formData.cycle_time_after) && (
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Impact Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Cycle Time Change:</span>
                <span className={`ml-2 ${
                  (formData.cycle_time_after - formData.cycle_time_before) < 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {(formData.cycle_time_after - formData.cycle_time_before).toFixed(1)} minutes
                </span>
              </div>
              {formData.tool_life_expected && formData.tool_life_actual && (
                <div>
                  <span className="font-medium">Tool Life Performance:</span>
                  <span className={`ml-2 ${
                    (formData.tool_life_actual / formData.tool_life_expected) >= 0.8 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((formData.tool_life_actual / formData.tool_life_expected) * 100).toFixed(0)}% of expected
                  </span>
                </div>
              )}
              {formData.scrap_pieces && formData.pieces_produced && (
                <div>
                  <span className="font-medium">Scrap Rate:</span>
                  <span className={`ml-2 ${
                    (formData.scrap_pieces / formData.pieces_produced) < 0.02 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((formData.scrap_pieces / formData.pieces_produced) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolChangeForm;
