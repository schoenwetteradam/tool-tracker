# 🔧 Tool Change Tracker

A simple, QR code-based system for tracking CNC tool changes and optimizing tool life in manufacturing environments.

## 🎯 Purpose

This system helps manufacturing teams:
- Track actual tool life across different machines and materials
- Identify optimization opportunities for tool performance
- Reduce tooling costs through data-driven decisions
- Standardize tool change documentation
- Improve quality consistency

## 📱 How It Works

1. **QR Codes**: Each machine has a unique QR code mounted nearby
2. **Quick Form**: Operators scan the code and fill out a 30-second form when changing tools
3. **Automatic Tracking**: Data is automatically logged to Google Sheets
4. **Real-time Analysis**: View tool performance data instantly

## 🚀 Features

- **Mobile-First**: Works on any smartphone - no app downloads required
- **Offline Capable**: Stores data temporarily if internet is down
- **Zero Cost**: Uses free Google Sheets for data storage
- **Easy Setup**: Deploy in under 30 minutes
- **Professional UI**: Clean, operator-friendly interface

## 📊 Data Collected

- Machine name and tool position
- Tool type and insert specifications
- Reason for tool change (wear, breakage, etc.)
- Approximate run time
- Material being machined
- Operator identification
- Timestamp and notes

## 🛠️ Setup Instructions

### 1. Google Sheets Integration
This form connects to a Google Apps Script web app that automatically logs data to a spreadsheet.

**Current Script URL**: `https://script.google.com/macros/s/AKfycbx3xAl7ILXMb8Y8RHh1vAcyZV0p23_wOcnpMSriLeS6tiUt3k6eqkVzWMGqve07lM_n/exec`

### 2. QR Code Generation
Use the included QR code generator (`qr-generator.html`) to create machine-specific codes.

### 3. Machine Installation
1. Generate QR code for each machine
2. Print and laminate for durability
3. Mount near tool change area
4. Train operators (30-second training)

## 📈 Expected Benefits

- **20-30% improvement** in tool life through optimization
- **Reduced scrap** from worn tool detection
- **Better quality consistency** through proactive tool changes
- **Data-driven purchasing** decisions for insert selection
- **Operator training** insights from performance variations

## 🔧 Technical Details

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **QR Codes**: Generated using qrcode.js library
- **Mobile Responsive**: Works on phones, tablets, computers

## 📋 Files

- `index.html` - Main tool change form
- `qr-generator.html` - QR code generator for machines
- `google-apps-script.js` - Backend script for Google Sheets integration

## 🎯 Implementation Strategy

### Phase 1: Pilot (Week 1-2)
- Start with 2-3 high-volume machines
- Train willing operators
- Collect initial data

### Phase 2: Analysis (Week 3-4)
- Analyze tool life patterns
- Identify optimization opportunities
- Calculate ROI and cost savings

### Phase 3: Expansion (Month 2+)
- Roll out to all applicable machines
- Implement data-driven improvements
- Continuous optimization

## 💡 Usage Tips

### For Operators
- Scan QR code immediately after tool change
- Form takes 30 seconds - faster than current guesswork
- Your input helps optimize the process for everyone

### For Engineers
- Review data weekly for trends
- Look for patterns by machine, material, operator
- Use insights to optimize speeds, feeds, and tool selection

### For Management
- Track cost reduction through improved tool life
- Monitor quality improvements
- Use data for evidence-based purchasing decisions

## 🔍 Troubleshooting

### QR Code Not Working
- Ensure form URL is correct and accessible
- Try typing URL manually to test
- Check QR code quality and size

### Form Not Submitting
- Check internet connection
- Verify Google Apps Script URL is active
- Look for error messages in browser console

### No Data in Sheets
- Confirm Google Apps Script is deployed as web app
- Check script permissions and sharing settings
- Verify sheet exists and is accessible

## 📞 Support

For technical issues or feature requests, contact the manufacturing engineering team.

## 🏭 Customization

This system can be easily customized for different:
- Machine types and configurations
- Tool insert specifications
- Material classifications
- Reporting requirements
- Integration with existing systems

---

**Built for manufacturing teams who want to optimize tool life through data-driven decisions.**
