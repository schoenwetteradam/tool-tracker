import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Wrench,
  Package,
  CheckCircle,
  Save,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { addToolChange } from '../lib/supabase';

const ToolChangeForm = () => {
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      shift: getShiftFromTime(now.getHours())
    };
  };

  const getShiftFromTime = (hour) => {
    if (hour >= 6 && hour < 14) return 1;
    if (hour >= 14 && hour < 22) return 2;
    return 3;
  };

  const [formData, setFormData] = useState({
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
    heat_number: '',
    material_appearance: 'Normal',
    insert_failure_mode: '',
    operator_observations: '',
    old_first_rougher: '',
    new_first_rougher: '',
    first_rougher_action: '',
    old_finish_tool: '',
    new_finish_tool: '',
    finish_tool_action: '',
    change_reason: '',
    notes: ''
  });

  const [availableInserts, setAvailableInserts] = useState({
    roughing: [],
    finishing: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [insertsLoading, setInsertsLoading] = useState(true);

  useEffect(() => {
    fetchApprovedInserts();
  }, []);

  const fetchApprovedInserts = async () => {
    try {
      setInsertsLoading(true);
      
      const roughingResponse = await fetch('/api/inserts/allowed?operation=ROUGHING');
      const roughingData = await roughingResponse.json();
      
      const finishingResponse = await fetch('/api/inserts/allowed?operation=FINISHING');
      const finishingData = await finishingResponse.json();
      
      setAvailableInserts({
        roughing: roughingData,
        finishing: finishingData
      });
    } catch (err) {
      console.error('Error fetching inserts:', err);
    } finally {
      setInsertsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStockStatus = (insert) => {
    if (!insert || !insert.quantity_on_hand || insert.quantity_on_hand <= 0) return 'out-of-stock';
    if (insert.quantity_on_hand <= insert.min_quantity) return 'low-stock';
    return 'in-stock';
  };

  const formatInsertOption = (insert) => {
    const stockStatus = getStockStatus(insert);
    const stockText = stockStatus === 'out-of-stock' ? ' (OUT OF STOCK)' : 
                     stockStatus === 'low-stock' ? ' (LOW STOCK)' : '';
    return `${insert.full_insert_id} - ${insert.description}${stockText}`;
  };

  const getInsertDetails = (insertId, operationType) => {
    const insertList = operationType === 'ROUGHING' ? availableInserts.roughing : availableInserts.finishing;
    return insertList.find(insert => insert.full_insert_id === insertId);
  };

  const calculateMaterialRiskScore = () => {
    let riskScore = 0;

    if (formData.heat_number?.startsWith('24')) riskScore += 2;
    if (formData.material_appearance && formData.material_appearance !== 'Normal') riskScore += 1;
    if (formData.insert_failure_mode === 'Sudden Fracture' || formData.insert_failure_mode === 'Edge Chipping') riskScore += 1;
    if (formData.change_reason === 'Tool Breakage') riskScore += 2;
    if (formData.change_reason === 'Chipped Edge') riskScore += 1;

    return Math.min(riskScore, 10);
  };

  const estimateCastingDate = (heatNumber) => {
    if (heatNumber?.startsWith('24')) {
      const sequence = heatNumber.substring(2);
      const monthEstimate = Math.ceil(parseInt(sequence.substring(0, 1)) * 1.2);
      return `2024-${monthEstimate.toString().padStart(2, '0')}-01`;
    } else if (heatNumber?.startsWith('25')) {
      const sequence = heatNumber.substring(2);
      const monthEstimate = Math.ceil(parseInt(sequence.substring(0, 1)) * 1.2);
      return `2025-${monthEstimate.toString().padStart(2, '0')}-01`;
    }
    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const requiredFields = [
        'date', 'time', 'shift', 'operator_id', 'work_center', 'equipment_number',
        'operation', 'part_number', 'old_first_rougher', 'new_first_rougher',
        'first_rougher_action', 'old_finish_tool', 'new_finish_tool',
        'finish_tool_action', 'change_reason', 'heat_number'
      ];

      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const cleanedData = {
        date: formData.date,
        time: formData.time,
        shift: formData.shift ? Number(formData.shift) : null,
        operator: formData.operator || null,
        operator_employee_id: formData.operator_employee_id || null,
        operator_clock_number: formData.operator_clock_number || null,
        operator_id: formData.operator_id || null,
        work_center: formData.work_center || null,
        equipment_number: formData.equipment_number || null,
        operation: formData.operation || null,
        part_number: formData.part_number || null,
        job_number: formData.job_number || null,
        old_first_rougher: formData.old_first_rougher || null,
        new_first_rougher: formData.new_first_rougher || null,
        first_rougher_action: formData.first_rougher_action || null,
        old_finish_tool: formData.old_finish_tool || null,
        new_finish_tool: formData.new_finish_tool || null,
        finish_tool_action: formData.finish_tool_action || null,
        heat_number: formData.heat_number || null,
        casting_date: estimateCastingDate(formData.heat_number),
        material_appearance: formData.material_appearance || 'Normal',
        insert_failure_mode: formData.insert_failure_mode || null,
        operator_observations: formData.operator_observations || null,
        material_risk_score: calculateMaterialRiskScore(),
        change_reason: formData.change_reason || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString()
      };

      const result = await addToolChange(cleanedData);
      setSubmitStatus('success');

      if (cleanedData.material_risk_score >= 5) {
        console.warn('High-risk material detected:', cleanedData.heat_number);
      }

      setTimeout(() => {
        setFormData({
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
          heat_number: '',
          material_appearance: 'Normal',
          insert_failure_mode: '',
          operator_observations: '',
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
      console.error('Error saving diagnostic tool change:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (insertsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading approved inserts...</p>
        </div>
      </div>
    );
  }

  const riskScore = calculateMaterialRiskScore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>Dashboard</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Insert Tracking</h1>
            </div>
            <div className="text-sm text-gray-500">2024 Process Diagnostic Mode</div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Tool change logged successfully with diagnostic data!
              </span>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                Error saving tool change. Please check required fields.
              </span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
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
                <option value="">Select Shift</option>
                <option value="1">1st Shift (6 AM - 2 PM)</option>
                <option value="2">2nd Shift (2 PM - 10 PM)</option>
                <option value="3">3rd Shift (10 PM - 6 AM)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Operator Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="operator"
                value={formData.operator}
                onChange={handleInputChange}
                required
                placeholder="First Last"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="operator_id"
                value={formData.operator_id}
                onChange={handleInputChange}
                required
                placeholder="Badge number or employee ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
            <Wrench className="mr-2" size={20} />
            Equipment & Operation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Center <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="work_center"
                value={formData.work_center}
                onChange={handleInputChange}
                required
                placeholder="e.g., 1770, 1689, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="equipment_number"
                value={formData.equipment_number}
                onChange={handleInputChange}
                required
                placeholder="Machine ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Bore">Bore</option>
                <option value="Turn">Turn</option>
                <option value="Face">Face</option>
                <option value="Thread">Thread</option>
                <option value="Drill">Drill</option>
                <option value="Mill">Mill</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Material Diagnostic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heat Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="heat_number"
                value={formData.heat_number}
                onChange={handleInputChange}
                placeholder="e.g., 24S0125, 25A0920"
                pattern="[0-9]{2}[A-Z][0-9]{4}"
                title="Format: 24S0125 (YY + Letter + 4 digits)"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Critical for 2024 process correlation analysis
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Appearance
              </label>
              <select
                name="material_appearance"
                value={formData.material_appearance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Normal">Normal</option>
                <option value="Discolored">Discolored</option>
                <option value="Rough Surface">Rough Surface</option>
                <option value="Porosity Visible">Porosity Visible</option>
                <option value="Hard Spots">Hard Spots</option>
                <option value="Inclusions">Inclusions Visible</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insert Failure Mode
              </label>
              <select
                name="insert_failure_mode"
                value={formData.insert_failure_mode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select failure mode</option>
                <option value="Edge Chipping">Edge Chipping</option>
                <option value="Crater Wear">Crater Wear</option>
                <option value="Sudden Fracture">Sudden Fracture</option>
                <option value="Premature Dulling">Premature Dulling</option>
                <option value="Built-up Edge">Built-up Edge</option>
                <option value="Thermal Cracking">Thermal Cracking</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator Observations
              </label>
              <textarea
                name="operator_observations"
                value={formData.operator_observations}
                onChange={handleInputChange}
                rows="2"
                placeholder="Material felt different? Unusual sounds? Surface finish issues?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {formData.heat_number?.startsWith('24') && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  2024 Material Detected - Enhanced tracking enabled for process correlation
                </span>
              </div>
            </div>
          )}

          {riskScore >= 5 && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  High Risk Material (Score: {riskScore}/10) - Consider enhanced monitoring
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
            <Package className="mr-2" size={20} />
            Tool Change Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Old First Rougher <span className="text-red-500">*</span>
              </label>
              <select
                name="old_first_rougher"
                value={formData.old_first_rougher}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select current insert</option>
                {availableInserts.roughing.map(insert => (
                  <option 
                    key={insert.full_insert_id} 
                    value={insert.full_insert_id}
                    disabled={getStockStatus(insert) === 'out-of-stock'}
                  >
                    {formatInsertOption(insert)}
                  </option>
                ))}
              </select>
              {formData.old_first_rougher && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  {(() => {
                    const insert = getInsertDetails(formData.old_first_rougher, 'ROUGHING');
                    return insert ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${getStockStatus(insert) === 'in-stock' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span>Stock: {insert.quantity_on_hand} | Cost: ${insert.unit_cost}/ea</span>
                    )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Finish Tool <span className="text-red-500">*</span>
              </label>
              <select
                name="new_finish_tool"
                value={formData.new_finish_tool}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select replacement insert</option>
                {availableInserts.finishing.map(insert => (
                  <option 
                    key={insert.full_insert_id} 
                    value={insert.full_insert_id}
                    disabled={getStockStatus(insert) === 'out-of-stock'}
                  >
                    {formatInsertOption(insert)}
                  </option>
                ))}
              </select>
              {formData.new_finish_tool && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  {(() => {
                    const insert = getInsertDetails(formData.new_finish_tool, 'FINISHING');
                    return insert ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${getStockStatus(insert) === 'in-stock' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span>Stock: {insert.quantity_on_hand} | Cost: ${insert.unit_cost}/ea</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish Tool Action <span className="text-red-500">*</span>
              </label>
              <select
                name="finish_tool_action"
                value={formData.finish_tool_action}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select action</option>
                <option value="new">New Insert</option>
                <option value="turn">Turn Insert</option>
                <option value="none">No Change</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Change Reason & Notes
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">Select reason</option>
                <option value="Normal Wear">Normal Wear</option>
                <option value="Tool Breakage">Tool Breakage</option>
                <option value="Chipped Edge">Chipped Edge</option>
                <option value="Poor Finish">Poor Finish</option>
                <option value="Size Issues">Size Issues</option>
                <option value="Scheduled Change">Scheduled Change</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any additional observations or context..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Saving Diagnostic Data...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Tool Change with Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolChangeForm;
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New First Rougher <span className="text-red-500">*</span>
              </label>
              <select
                name="new_first_rougher"
                value={formData.new_first_rougher}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select replacement insert</option>
                {availableInserts.roughing.map(insert => (
                  <option 
                    key={insert.full_insert_id} 
                    value={insert.full_insert_id}
                    disabled={getStockStatus(insert) === 'out-of-stock'}
                  >
                    {formatInsertOption(insert)}
                  </option>
                ))}
              </select>
              {formData.new_first_rougher && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  {(() => {
                    const insert = getInsertDetails(formData.new_first_rougher, 'ROUGHING');
                    return insert ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${getStockStatus(insert) === 'in-stock' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span>Stock: {insert.quantity_on_hand} | Cost: ${insert.unit_cost}/ea</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Rougher Action <span className="text-red-500">*</span>
              </label>
              <select
                name="first_rougher_action"
                value={formData.first_rougher_action}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select action</option>
                <option value="new">New Insert</option>
                <option value="turn">Turn Insert</option>
                <option value="none">No Change</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Old Finish Tool <span className="text-red-500">*</span>
              </label>
              <select
                name="old_finish_tool"
                value={formData.old_finish_tool}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select current insert</option>
                {availableInserts.finishing.map(insert => (
                  <option 
                    key={insert.full_insert_id} 
                    value={insert.full_insert_id}
                    disabled={getStockStatus(insert) === 'out-of-stock'}
                  >
                    {formatInsertOption(insert)}
                  </option>
                ))}
              </select>
              {formData.old_finish_tool && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  {(() => {
                    const insert = getInsertDetails(formData.old_finish_tool, 'FINISHING');
                    return insert ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${getStockStatus(insert) === 'in-stock' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span>Stock: {insert.quantity_on_hand} | Cost: ${insert.unit_cost}/ea</span>
                      </div>
                    ) : null;
                  })()}
                </div
