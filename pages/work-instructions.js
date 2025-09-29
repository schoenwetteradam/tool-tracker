import React from 'react';
import { CheckCircle, AlertCircle, Smartphone, ClipboardList, Save } from 'lucide-react';

export default function InsertChangeInstructions() {
  const printDoc = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; padding: 20px; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center border-b-4 border-blue-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">WORK INSTRUCTION</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Insert Change Form Application</h2>
        <div className="flex justify-between mt-4 text-sm">
          <div><strong>Document ID:</strong> WI-TOOL-001</div>
          <div><strong>Revision:</strong> A</div>
          <div><strong>Date:</strong> September 29, 2025</div>
        </div>
      </div>

      {/* Purpose Section */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">PURPOSE</h3>
        <p className="text-gray-700 leading-relaxed">
          This work instruction provides step-by-step guidance for machine operators to properly document insert changes 
          using the digital Insert Change Form application. Accurate documentation ensures proper tool cost tracking, 
          inventory management, and production quality control.
        </p>
      </section>

      {/* Scope */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">SCOPE</h3>
        <p className="text-gray-700 leading-relaxed">
          This procedure applies to all machining operators performing insert changes on CNC equipment. 
          All insert changes must be documented immediately after completion.
        </p>
      </section>

      {/* Safety & Quality Requirements */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">
          SAFETY & QUALITY REQUIREMENTS
        </h3>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="font-semibold text-yellow-800 mb-2">IMPORTANT:</p>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>Always follow lockout/tagout procedures before changing inserts</li>
                <li>Verify machine is in proper state before opening guards</li>
                <li>Document changes within 5 minutes of completion</li>
                <li>Ensure correct insert selection from inventory</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="page-break"></div>

      {/* Equipment Needed */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">EQUIPMENT NEEDED</h3>
        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li>Smartphone or tablet with camera</li>
          <li>Access to company Wi-Fi network</li>
          <li>Insert change information (old insert ID, new insert ID)</li>
          <li>Shop order or work order number</li>
        </ul>
      </section>

      {/* Step-by-Step Procedure */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">
          PROCEDURE: ACCESSING THE FORM
        </h3>

        {/* Step 1 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">1</div>
            <h4 className="text-lg font-semibold text-gray-800">Scan the QR Code at Your Machine</h4>
          </div>
          <div className="ml-11">
            <p className="text-gray-700 mb-2">
              Each machine has a QR code posted near the operator station. Using your smartphone:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700">
              <li>Open your phone's camera app</li>
              <li>Point camera at the QR code</li>
              <li>Tap the notification that appears at the top of your screen</li>
              <li>The Insert Change Form will open automatically in your browser</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 p-3 mt-3 rounded">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> The QR code automatically fills in your machine number. 
                If scanning doesn't work, manually type the web address shown below the QR code.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">2</div>
            <h4 className="text-lg font-semibold text-gray-800">Complete Job Information Section</h4>
          </div>
          <div className="ml-11">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Field Name</th>
                  <th className="border border-gray-300 p-2 text-left">What to Enter</th>
                  <th className="border border-gray-300 p-2 text-left">Required?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Machine Number</td>
                  <td className="border border-gray-300 p-2">Pre-filled from QR code (verify it's correct)</td>
                  <td className="border border-gray-300 p-2 text-center">✓ Yes</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Shop Order</td>
                  <td className="border border-gray-300 p-2">Enter the shop order number from your work order</td>
                  <td className="border border-gray-300 p-2 text-center">✓ Yes</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Heat Number</td>
                  <td className="border border-gray-300 p-2">Enter heat number if applicable (leave blank if not)</td>
                  <td className="border border-gray-300 p-2 text-center">No</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Shift</td>
                  <td className="border border-gray-300 p-2">Select your current shift (1st, 2nd, or 3rd)</td>
                  <td className="border border-gray-300 p-2 text-center">✓ Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="page-break"></div>

        {/* Step 3 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">3</div>
            <h4 className="text-lg font-semibold text-gray-800">Enter Operator Information</h4>
          </div>
          <div className="ml-11">
            <p className="text-gray-700 mb-3">Select your name from the dropdown list:</p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700 mb-3">
              <li>Click the "Operator" dropdown</li>
              <li>Find and select your name</li>
              <li>Your employee ID and clock number will auto-fill</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-sm text-gray-800">
                <strong>What if my name isn't listed?</strong> Contact your supervisor to have your operator profile added to the system.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">4</div>
            <h4 className="text-lg font-semibold text-gray-800">Document Roughing Insert Change</h4>
          </div>
          <div className="ml-11">
            <p className="text-gray-700 mb-3 font-semibold">Old Roughing Insert:</p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700 mb-4">
              <li>Select the insert you are REMOVING from the dropdown</li>
              <li>The system shows the insert description and current stock level</li>
            </ul>

            <p className="text-gray-700 mb-3 font-semibold">Rougher Action:</p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700 mb-4">
              <li><strong>New Insert:</strong> Select this if installing a brand new insert</li>
              <li><strong>Index (Rotate):</strong> Select this if you're just rotating the existing insert</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> If you select "New Insert," two additional fields will appear:
              </p>
              <ol className="list-decimal ml-6 mt-2 space-y-1 text-sm text-blue-900">
                <li><strong>New Roughing Insert:</strong> Select the insert you are INSTALLING</li>
                <li><strong>Rougher Change Reason:</strong> Select why you're changing the insert</li>
              </ol>
            </div>

            <p className="text-gray-700 mb-2 font-semibold">Change Reason Options:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm text-gray-700">
              <li><strong>Normal wear:</strong> Insert reached end of useful life</li>
              <li><strong>Tool Breakage:</strong> Insert broke or fractured</li>
              <li><strong>Chipped Edge:</strong> Cutting edge is chipped</li>
              <li><strong>Poor finish:</strong> Insert creating poor surface finish</li>
              <li><strong>Size problems:</strong> Parts going out of tolerance</li>
              <li><strong>Scheduled maintenance:</strong> Preventive insert replacement</li>
            </ul>
          </div>
        </div>

        {/* Step 5 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">5</div>
            <h4 className="text-lg font-semibold text-gray-800">Document Finishing Insert Change (If Applicable)</h4>
          </div>
          <div className="ml-11">
            <p className="text-gray-700 mb-3">
              If you also changed the finishing insert, complete this section using the same process as Step 4:
            </p>
            <ol className="list-decimal ml-6 space-y-2 text-gray-700">
              <li>Select the old finishing insert being removed</li>
              <li>Choose "New Insert" or "Index (Rotate)"</li>
              <li>If new insert, select the new finishing insert and change reason</li>
            </ol>
            <div className="bg-gray-100 border border-gray-300 p-3 mt-3 rounded">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> The finish section is optional. Leave blank if you only changed the roughing insert.
              </p>
            </div>
          </div>
        </div>

        <div className="page-break"></div>

        {/* Step 6 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">6</div>
            <h4 className="text-lg font-semibold text-gray-800">Review Cost Summary</h4>
          </div>
          <div className="ml-11">
            <p className="text-gray-700 mb-3">
              Before submitting, review the cost summary box that appears at the bottom of the form:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-gray-700">
              <li>Shows the cost of new inserts being installed</li>
              <li>Displays total tooling cost for this change</li>
              <li>Verify the amounts look reasonable</li>
            </ul>
          </div>
        </div>

        {/* Step 7 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">7</div>
            <h4 className="text-lg font-semibold text-gray-800">Submit the Form</h4>
          </div>
          <div className="ml-11">
            <ol className="list-decimal ml-6 space-y-2 text-gray-700 mb-4">
              <li>Double-check all required fields are filled in (marked with red *)</li>
              <li>Click the blue "Submit Tool Change" button at the bottom</li>
              <li>Wait for the success confirmation message</li>
              <li>You will see "Tool change submitted successfully!"</li>
            </ol>
            <div className="bg-green-50 border-l-4 border-green-500 p-3">
              <div className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={20} />
                <p className="text-sm text-green-900">
                  <strong>Success!</strong> Your insert change has been recorded. The inventory system 
                  has been automatically updated, and costs have been tracked to your shop order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Status Indicators */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">
          UNDERSTANDING STOCK STATUS INDICATORS
        </h3>
        <p className="text-gray-700 mb-3">
          When selecting inserts, you'll see stock status icons next to each option:
        </p>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2 text-center">Icon</th>
              <th className="border border-gray-300 p-2 text-left">Status</th>
              <th className="border border-gray-300 p-2 text-left">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 text-center text-2xl">✅</td>
              <td className="border border-gray-300 p-2 font-semibold">In Stock</td>
              <td className="border border-gray-300 p-2">Adequate quantity available, proceed normally</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 text-center text-2xl">⚠️</td>
              <td className="border border-gray-300 p-2 font-semibold">Low Stock</td>
              <td className="border border-gray-300 p-2">Quantity is low - notify supervisor after completing form</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 text-center text-2xl">❌</td>
              <td className="border border-gray-300 p-2 font-semibold">Out of Stock</td>
              <td className="border border-gray-300 p-2">Zero quantity - contact supervisor before proceeding</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="page-break"></div>

      {/* Troubleshooting */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">TROUBLESHOOTING</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-semibold text-gray-800 mb-1">Problem: QR code won't scan</p>
            <p className="text-gray-700 text-sm">
              <strong>Solution:</strong> Check that your phone camera is in focus and there's adequate lighting. 
              Alternatively, manually type the web address shown below the QR code into your browser.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-semibold text-gray-800 mb-1">Problem: Insert not listed in dropdown</p>
            <p className="text-gray-700 text-sm">
              <strong>Solution:</strong> The insert may not be in the system inventory. Contact your supervisor 
              to have the insert added before continuing.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-semibold text-gray-800 mb-1">Problem: Form won't submit</p>
            <p className="text-gray-700 text-sm">
              <strong>Solution:</strong> Check that all required fields (marked with *) are completed. 
              Scroll through the form to find any red error messages. Verify you have internet connection.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-semibold text-gray-800 mb-1">Problem: My name isn't in operator list</p>
            <p className="text-gray-700 text-sm">
              <strong>Solution:</strong> Contact your supervisor to create your operator profile in the system.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <p className="font-semibold text-gray-800 mb-1">Problem: Made a mistake after submitting</p>
            <p className="text-gray-700 text-sm">
              <strong>Solution:</strong> Contact your supervisor immediately. They can correct the entry in the system.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">BEST PRACTICES</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={18} />
            <span className="text-gray-700">Complete the form immediately after changing inserts (within 5 minutes)</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={18} />
            <span className="text-gray-700">Double-check insert numbers before submitting to ensure accuracy</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={18} />
            <span className="text-gray-700">Pay attention to stock status warnings and notify supervisor of low stock</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={18} />
            <span className="text-gray-700">Select accurate change reasons to help with tooling analysis</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-1" size={18} />
            <span className="text-gray-700">Keep QR codes clean and visible for easy scanning</span>
          </li>
        </ul>
      </section>

      {/* Quality Records */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 border-b-2 border-gray-300 pb-2">QUALITY RECORDS</h3>
        <p className="text-gray-700 mb-2">All insert change data is automatically stored in the system database and includes:</p>
        <ul className="list-disc ml-6 space-y-1 text-gray-700">
          <li>Date and time stamp of change</li>
          <li>Operator information</li>
          <li>Old and new insert identification</li>
          <li>Reason for change</li>
          <li>Associated costs</li>
          <li>Inventory adjustments</li>
        </ul>
        <p className="text-gray-700 mt-3">
          Records are retained indefinitely for quality audits, cost analysis, and process improvement initiatives.
        </p>
      </section>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 mt-8">
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold">Prepared By:</p>
            <p>Manufacturing Engineering</p>
          </div>
          <div>
            <p className="font-semibold">Approved By:</p>
            <p>Production Manager</p>
          </div>
          <div>
            <p className="font-semibold">Review Date:</p>
            <p>Annually or as needed</p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="no-print mt-8 text-center">
        <button
          onClick={printDoc}
          className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg"
        >
          🖨️ Print Work Instructions
        </button>
        <p className="text-sm text-gray-600 mt-3">
          This will print a formatted version suitable for posting at workstations
        </p>
      </div>
    </div>
  );
}
