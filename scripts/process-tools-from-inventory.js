// scripts/process-tools-from-inventory.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function processToolsFromInventory() {
  try {
    console.log('Fetching potential tools from your inventory...')
    
    // Get potential tools from the view we created
    const { data: potentialTools, error: fetchError } = await supabase
      .from('potential_tools')
      .select('*')
      .gte('tool_score', 5) // Only get items with a decent tool score

    if (fetchError) throw fetchError
    
    console.log(`Found ${potentialTools.length} potential tools to process`)

    // Process each potential tool
    const processedTools = potentialTools.map(item => {
      const category = determineToolCategory(item.material_id, item.description)
      const toolType = extractToolType(item.description)
      const insertType = extractInsertType(item.description)
      const insertGrade = extractInsertGrade(item.description)
      const manufacturer = extractManufacturer(item.description)

      return {
        material_id: item.material_id,
        tool_id: item.material_id,
        description: item.description,
        category: category,
        tool_type: toolType,
        insert_type: insertType,
        insert_grade: insertGrade,
        manufacturer: manufacturer,
        supplier: item.supplier,
        unit_cost: 0, // You'll need to add cost data separately
        quantity_on_hand: item.quantity_on_hand || 0,
        min_quantity: Math.max(Math.floor((item.quantity_on_hand || 0) * 0.2), 1),
        specifications: {
          stocking_um: item.stocking_um,
          purchased_um: item.purchased_um,
          original_specifications: item.specifications,
          tool_score: item.tool_score
        },
        active: item.active === 'yes'
      }
    }).filter(tool => tool.category !== 'UNKNOWN')

    console.log(`Processed ${processedTools.length} valid tools`)

    if (processedTools.length > 0) {
      // Clear existing tool inventory (optional)
      console.log('Clearing existing tool inventory...')
      await supabase.from('tool_inventory').delete().gte('id', 0)

      // Insert processed tools in batches
      const batchSize = 20
      let totalInserted = 0

      for (let i = 0; i < processedTools.length; i += batchSize) {
        const batch = processedTools.slice(i, i + batchSize)
        
        const { data, error } = await supabase
          .from('tool_inventory')
          .insert(batch)

        if (error) {
          console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error)
        } else {
          totalInserted += batch.length
          console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} tools (Total: ${totalInserted})`)
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`✅ Successfully processed ${totalInserted} tools from your inventory!`)
      
      // Show summary by category
      const { data: summary } = await supabase
        .from('tool_inventory')
        .select('category')
        .eq('active', true)

      const categoryCounts = summary.reduce((acc, tool) => {
        acc[tool.category] = (acc[tool.category] || 0) + 1
        return acc
      }, {})

      console.log('\n📊 Tool Summary by Category:')
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} items`)
      })

    } else {
      console.log('⚠️  No valid tools found. You may need to manually add some tool data.')
    }
    
  } catch (error) {
    console.error('❌ Processing failed:', error)
  }
}

function determineToolCategory(materialId, description) {
  const id = (materialId || '').toLowerCase()
  const desc = (description || '').toLowerCase()
  
  // Insert patterns (most specific first)
  if (desc.includes('insert') || 
      desc.match(/[cdrtw]n[mg][gct]\s*\d/) || 
      desc.match(/[cdrtw]c[mg][tg]\s*\d/) ||
      desc.match(/[sv]c[mg][tg]\s*\d/) ||
      desc.match(/[ar]c[mg][tg]\s*\d/)) {
    return 'INSERT'
  }
  
  // Drill patterns
  if (desc.includes('drill') && !desc.includes('drilling')) {
    return 'DRILL'
  }
  
  // Mill patterns
  if (desc.includes('mill') || desc.includes('milling') || desc.includes('end mill')) {
    return 'MILL'
  }
  
  // Tap patterns
  if (desc.includes('tap') && !desc.includes('tape')) {
    return 'TAP'
  }
  
  // Reamer patterns
  if (desc.includes('ream')) {
    return 'REAMER'
  }
  
  // Boring patterns
  if (desc.includes('boring') || desc.includes('bore')) {
    return 'BORING'
  }
  
  // General carbide tools
  if (desc.includes('carbide') || desc.includes('hss')) {
    return 'TOOL'
  }
  
  // Holder patterns
  if (desc.includes('holder') || desc.includes('toolholder')) {
    return 'HOLDER'
  }
  
  return 'UNKNOWN'
}

function extractToolType(description) {
  const desc = (description || '').toLowerCase()
  
  if (desc.includes('turn') || desc.match(/[cdrtw]n[mg][gct]/)) return 'TURNING'
  if (desc.includes('mill') || desc.includes('face') || desc.match(/[rs]c[mg][tg]/)) return 'MILLING'
  if (desc.includes('drill')) return 'DRILLING'
  if (desc.includes('boring')) return 'BORING'
  if (desc.includes('tap')) return 'TAPPING'
  if (desc.includes('ream')) return 'REAMING'
  
  return 'GENERAL'
}

function extractInsertType(description) {
  const desc = description || ''
  
  // Look for standard insert designations (4 letters + 3-4 digits)
  const insertPatterns = [
    /([CDRTW][NM][MG][GCTF])\s*(\d{3,4})/i,
    /([SVRH][CVM][MG][TG])\s*(\d{3,4})/i,
    /([AP][NPQR][MG][TG])\s*(\d{3,4})/i
  ]
  
  for (const pattern of insertPatterns) {
    const match = desc.match(pattern)
    if (match) {
      return match[1].toUpperCase() + match[2]
    }
  }
  
  // Look for other common patterns
  const simpleMatch = desc.match(/([A-Z]{4})\s*(\d{3,4})/i)
  if (simpleMatch) {
    return simpleMatch[1].toUpperCase() + simpleMatch[2]
  }
  
  return null
}

function extractInsertGrade(description) {
  const desc = description || ''
  
  // Common carbide grades
  const gradePatterns = [
    /KC\s*(\d{3,4})/i,
    /K\s*(\d{2})/i,
    /P\s*(\d{2})/i,
    /M\s*(\d{2})/i,
    /(TiN)/i,
    /(TiAlN)/i,
    /(CVD)/i,
    /(PVD)/i,
    /(CERMET)/i,
    /(HSS)/i
  ]
  
  for (const pattern of gradePatterns) {
    const match = desc.match(pattern)
    if (match) {
      return match[0].toUpperCase().replace(/\s+/g, '')
    }
  }
  
  return null
}

function extractManufacturer(description) {
  const manufacturers = [
    'KENNAMETAL', 'SANDVIK', 'ISCAR', 'SECO', 'WALTER', 'KORLOY',
    'MITSUBISHI', 'KYOCERA', 'SUMITOMO', 'TUNGALOY', 'CERATIZIT',
    'VARDEX', 'TAEGUTEC', 'STELLRAM', 'DORMER', 'GUHRING'
  ]
  
  const desc = (description || '').toUpperCase()
  for (const mfg of manufacturers) {
    if (desc.includes(mfg)) {
      return mfg
    }
  }
  
  return null
}

// Run the processing
processToolsFromInventory()
