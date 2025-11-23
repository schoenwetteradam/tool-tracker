// lib/odysseyERP.js - Odyssey ERP Integration Service
// Connects to B&L Information Systems Odyssey ERP cloud API

import { createClient } from '@supabase/supabase-js'

// Odyssey ERP API Configuration
const ODYSSEY_API_BASE_URL = process.env.ODYSSEY_ERP_API_URL || 'https://api.blinfo.com'
const ODYSSEY_COMPANY_ID = process.env.ODYSSEY_ERP_COMPANY_ID || 'SPUNCAST'
const ODYSSEY_API_KEY = process.env.ODYSSEY_ERP_API_KEY
const ODYSSEY_API_SECRET = process.env.ODYSSEY_ERP_API_SECRET
const ODYSSEY_USERNAME = process.env.ODYSSEY_ERP_USERNAME
const ODYSSEY_PASSWORD = process.env.ODYSSEY_ERP_PASSWORD

// Supabase configuration for local data storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin = null
if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

// Custom error class for Odyssey ERP API errors
export class OdysseyERPError extends Error {
  constructor(message, code, details) {
    super(message)
    this.name = 'OdysseyERPError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// Check if Odyssey ERP credentials are configured
export function isOdysseyERPConfigured() {
  return Boolean(
    ODYSSEY_API_BASE_URL &&
    ODYSSEY_COMPANY_ID &&
    (ODYSSEY_API_KEY || (ODYSSEY_USERNAME && ODYSSEY_PASSWORD))
  )
}

// Get Odyssey ERP configuration status
export function getOdysseyERPConfig() {
  return {
    configured: isOdysseyERPConfigured(),
    apiUrl: ODYSSEY_API_BASE_URL,
    companyId: ODYSSEY_COMPANY_ID,
    hasApiKey: Boolean(ODYSSEY_API_KEY),
    hasCredentials: Boolean(ODYSSEY_USERNAME && ODYSSEY_PASSWORD)
  }
}

// Token storage for session-based authentication
let authToken = null
let tokenExpiry = null

// Authenticate with Odyssey ERP
async function authenticate() {
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken
  }

  if (!isOdysseyERPConfigured()) {
    throw new OdysseyERPError(
      'Odyssey ERP credentials not configured',
      'AUTH_NOT_CONFIGURED',
      'Set ODYSSEY_ERP_API_KEY or ODYSSEY_ERP_USERNAME/ODYSSEY_ERP_PASSWORD environment variables'
    )
  }

  try {
    const endpoint = `${ODYSSEY_API_BASE_URL}/${ODYSSEY_COMPANY_ID}/auth/token`

    const authBody = ODYSSEY_API_KEY
      ? { apiKey: ODYSSEY_API_KEY, apiSecret: ODYSSEY_API_SECRET }
      : { username: ODYSSEY_USERNAME, password: ODYSSEY_PASSWORD }

    console.log('🔐 Authenticating with Odyssey ERP...')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(authBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new OdysseyERPError(
        errorData.message || `Authentication failed: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    const data = await response.json()
    authToken = data.token || data.access_token

    // Set token expiry (default 1 hour if not specified)
    const expiresIn = data.expires_in || 3600
    tokenExpiry = new Date(Date.now() + expiresIn * 1000)

    console.log('✅ Odyssey ERP authentication successful')
    return authToken
  } catch (error) {
    if (error instanceof OdysseyERPError) throw error
    throw new OdysseyERPError(
      `Authentication failed: ${error.message}`,
      'AUTH_ERROR',
      error
    )
  }
}

// Generic fetch wrapper for Odyssey ERP API
async function odysseyFetch(endpoint, options = {}) {
  const token = await authenticate()

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${ODYSSEY_API_BASE_URL}/${ODYSSEY_COMPANY_ID}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }

  console.log(`🌐 Odyssey ERP API: ${options.method || 'GET'} ${endpoint}`)

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new OdysseyERPError(
      errorData.message || `API request failed: ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

// ==========================================
// PRODUCTS / ITEMS
// ==========================================

// Fetch products/items from Odyssey ERP
export async function fetchProducts(options = {}) {
  const {
    modifiedSince,
    productNumber,
    category,
    limit = 1000,
    offset = 0
  } = options

  let endpoint = '/api/items'
  const params = new URLSearchParams()

  if (modifiedSince) params.append('modifiedSince', modifiedSince)
  if (productNumber) params.append('itemNumber', productNumber)
  if (category) params.append('category', category)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.items || data.data || data
}

// Map Odyssey product to local product format
function mapOdysseyProductToLocal(odysseyProduct) {
  return {
    product_number: odysseyProduct.itemNumber || odysseyProduct.item_number,
    product_description: odysseyProduct.description || odysseyProduct.item_description,
    category: odysseyProduct.category || odysseyProduct.item_class,
    unit_of_measure: odysseyProduct.uom || odysseyProduct.unit_of_measure,
    unit_weight: parseFloat(odysseyProduct.weight) || null,
    unit_cost: parseFloat(odysseyProduct.standardCost || odysseyProduct.cost) || null,
    active: odysseyProduct.active !== false,
    odyssey_item_id: odysseyProduct.id || odysseyProduct.itemId,
    last_synced: new Date().toISOString()
  }
}

// Sync products from Odyssey ERP to local database
export async function syncProducts(options = {}) {
  const startTime = Date.now()
  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    products: []
  }

  try {
    console.log('📦 Syncing products from Odyssey ERP...')

    const odysseyProducts = await fetchProducts(options)
    console.log(`📥 Fetched ${odysseyProducts.length} products from Odyssey ERP`)

    if (odysseyProducts.length === 0) {
      return results
    }

    const mappedProducts = odysseyProducts.map(mapOdysseyProductToLocal)
    results.products = mappedProducts

    // Store in local database if configured
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('odyssey_products')
        .upsert(mappedProducts, { onConflict: 'product_number' })

      if (error) {
        console.error('❌ Error saving products to database:', error)
        results.errors.push(`Database error: ${error.message}`)
        results.failed = mappedProducts.length
      } else {
        results.synced = mappedProducts.length
        console.log(`✅ Synced ${results.synced} products to local database`)
      }

      // Log sync
      await logSync('products', results, Date.now() - startTime)
    } else {
      results.synced = mappedProducts.length
    }

  } catch (error) {
    console.error('❌ Error syncing products:', error)
    results.success = false
    results.errors.push(error.message)
  }

  return results
}

// ==========================================
// SHOP ORDERS / WORK ORDERS
// ==========================================

// Fetch shop orders from Odyssey ERP
export async function fetchShopOrders(options = {}) {
  const {
    status,
    jobNumber,
    partNumber,
    dateFrom,
    dateTo,
    limit = 500,
    offset = 0
  } = options

  let endpoint = '/api/shop-orders'
  const params = new URLSearchParams()

  if (status) params.append('status', status)
  if (jobNumber) params.append('orderNumber', jobNumber)
  if (partNumber) params.append('itemNumber', partNumber)
  if (dateFrom) params.append('startDate', dateFrom)
  if (dateTo) params.append('endDate', dateTo)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.orders || data.shopOrders || data.data || data
}

// Map Odyssey shop order to local format
function mapOdysseyShopOrderToLocal(order) {
  return {
    job_number: order.orderNumber || order.job_number || order.shopOrderNumber,
    part_number: order.itemNumber || order.part_number,
    description: order.description || order.item_description,
    quantity_ordered: parseInt(order.quantityOrdered || order.qty_ordered) || 0,
    quantity_completed: parseInt(order.quantityCompleted || order.qty_completed) || 0,
    quantity_remaining: parseInt(order.quantityRemaining || order.qty_remaining) || 0,
    status: order.status || 'Open',
    priority: order.priority || 'Normal',
    start_date: order.startDate || order.start_date,
    due_date: order.dueDate || order.due_date,
    completion_date: order.completionDate || order.completion_date,
    work_center: order.workCenter || order.work_center,
    customer: order.customerName || order.customer,
    customer_po: order.customerPO || order.customer_po,
    notes: order.notes || order.comments,
    odyssey_order_id: order.id || order.shopOrderId,
    last_synced: new Date().toISOString()
  }
}

// Sync shop orders from Odyssey ERP
export async function syncShopOrders(options = {}) {
  const startTime = Date.now()
  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    orders: []
  }

  try {
    console.log('📋 Syncing shop orders from Odyssey ERP...')

    const odysseyOrders = await fetchShopOrders(options)
    console.log(`📥 Fetched ${odysseyOrders.length} shop orders from Odyssey ERP`)

    if (odysseyOrders.length === 0) {
      return results
    }

    const mappedOrders = odysseyOrders.map(mapOdysseyShopOrderToLocal)
    results.orders = mappedOrders

    // Store in local database if configured
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('odyssey_shop_orders')
        .upsert(mappedOrders, { onConflict: 'job_number' })

      if (error) {
        console.error('❌ Error saving shop orders to database:', error)
        results.errors.push(`Database error: ${error.message}`)
        results.failed = mappedOrders.length
      } else {
        results.synced = mappedOrders.length
        console.log(`✅ Synced ${results.synced} shop orders to local database`)
      }

      // Log sync
      await logSync('shop_orders', results, Date.now() - startTime)
    } else {
      results.synced = mappedOrders.length
    }

  } catch (error) {
    console.error('❌ Error syncing shop orders:', error)
    results.success = false
    results.errors.push(error.message)
  }

  return results
}

// ==========================================
// PRODUCTION HISTORY
// ==========================================

// Fetch production history from Odyssey ERP
export async function fetchProductionHistory(options = {}) {
  const {
    jobNumber,
    partNumber,
    workCenter,
    dateFrom,
    dateTo,
    limit = 1000,
    offset = 0
  } = options

  let endpoint = '/api/production-history'
  const params = new URLSearchParams()

  if (jobNumber) params.append('orderNumber', jobNumber)
  if (partNumber) params.append('itemNumber', partNumber)
  if (workCenter) params.append('workCenter', workCenter)
  if (dateFrom) params.append('startDate', dateFrom)
  if (dateTo) params.append('endDate', dateTo)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.history || data.production || data.data || data
}

// Map Odyssey production record to local format
function mapOdysseyProductionToLocal(record) {
  return {
    job_number: record.orderNumber || record.job_number,
    operation_number: record.operationNumber || record.operation_number,
    part_number: record.itemNumber || record.part_number,
    work_center: record.workCenter || record.work_center,
    quantity_produced: parseInt(record.quantityProduced || record.qty_produced) || 0,
    quantity_scrapped: parseInt(record.quantityScrapped || record.qty_scrapped) || 0,
    production_date: record.productionDate || record.date,
    shift: record.shift,
    operator: record.operator || record.employeeId,
    machine: record.machine || record.equipment,
    setup_hours: parseFloat(record.setupHours || record.setup_time) || 0,
    run_hours: parseFloat(record.runHours || record.run_time) || 0,
    labor_hours: parseFloat(record.laborHours || record.labor_time) || 0,
    notes: record.notes || record.comments,
    odyssey_production_id: record.id || record.productionId,
    last_synced: new Date().toISOString()
  }
}

// Sync production history from Odyssey ERP
export async function syncProductionHistory(options = {}) {
  const startTime = Date.now()
  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    records: []
  }

  try {
    console.log('📊 Syncing production history from Odyssey ERP...')

    const odysseyRecords = await fetchProductionHistory(options)
    console.log(`📥 Fetched ${odysseyRecords.length} production records from Odyssey ERP`)

    if (odysseyRecords.length === 0) {
      return results
    }

    const mappedRecords = odysseyRecords.map(mapOdysseyProductionToLocal)
    results.records = mappedRecords

    // Store in local database if configured
    if (supabaseAdmin) {
      // Batch insert in chunks of 500
      const batchSize = 500
      for (let i = 0; i < mappedRecords.length; i += batchSize) {
        const batch = mappedRecords.slice(i, i + batchSize)
        const { error } = await supabaseAdmin
          .from('odyssey_production_history')
          .upsert(batch, { onConflict: 'odyssey_production_id' })

        if (error) {
          console.error(`❌ Error saving batch ${i / batchSize + 1}:`, error)
          results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`)
          results.failed += batch.length
        } else {
          results.synced += batch.length
        }
      }

      console.log(`✅ Synced ${results.synced} production records to local database`)

      // Log sync
      await logSync('production_history', results, Date.now() - startTime)
    } else {
      results.synced = mappedRecords.length
    }

  } catch (error) {
    console.error('❌ Error syncing production history:', error)
    results.success = false
    results.errors.push(error.message)
  }

  return results
}

// ==========================================
// INVENTORY
// ==========================================

// Fetch inventory levels from Odyssey ERP
export async function fetchInventory(options = {}) {
  const {
    itemNumber,
    warehouse,
    location,
    limit = 1000,
    offset = 0
  } = options

  let endpoint = '/api/inventory'
  const params = new URLSearchParams()

  if (itemNumber) params.append('itemNumber', itemNumber)
  if (warehouse) params.append('warehouse', warehouse)
  if (location) params.append('location', location)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.inventory || data.items || data.data || data
}

// Map Odyssey inventory to local format
function mapOdysseyInventoryToLocal(item) {
  return {
    item_number: item.itemNumber || item.item_number,
    description: item.description || item.item_description,
    warehouse: item.warehouse || item.warehouse_code,
    location: item.location || item.bin_location,
    quantity_on_hand: parseFloat(item.quantityOnHand || item.qty_on_hand) || 0,
    quantity_available: parseFloat(item.quantityAvailable || item.qty_available) || 0,
    quantity_allocated: parseFloat(item.quantityAllocated || item.qty_allocated) || 0,
    quantity_on_order: parseFloat(item.quantityOnOrder || item.qty_on_order) || 0,
    unit_cost: parseFloat(item.unitCost || item.unit_cost) || null,
    total_value: parseFloat(item.totalValue || item.extended_cost) || null,
    last_receipt_date: item.lastReceiptDate || item.last_receipt,
    odyssey_inventory_id: item.id || item.inventoryId,
    last_synced: new Date().toISOString()
  }
}

// Sync inventory from Odyssey ERP
export async function syncInventory(options = {}) {
  const startTime = Date.now()
  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
    items: []
  }

  try {
    console.log('📦 Syncing inventory from Odyssey ERP...')

    const odysseyInventory = await fetchInventory(options)
    console.log(`📥 Fetched ${odysseyInventory.length} inventory records from Odyssey ERP`)

    if (odysseyInventory.length === 0) {
      return results
    }

    const mappedItems = odysseyInventory.map(mapOdysseyInventoryToLocal)
    results.items = mappedItems

    // Store in local database if configured
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('odyssey_inventory')
        .upsert(mappedItems, { onConflict: 'item_number,warehouse,location' })

      if (error) {
        console.error('❌ Error saving inventory to database:', error)
        results.errors.push(`Database error: ${error.message}`)
        results.failed = mappedItems.length
      } else {
        results.synced = mappedItems.length
        console.log(`✅ Synced ${results.synced} inventory records to local database`)
      }

      // Log sync
      await logSync('inventory', results, Date.now() - startTime)
    } else {
      results.synced = mappedItems.length
    }

  } catch (error) {
    console.error('❌ Error syncing inventory:', error)
    results.success = false
    results.errors.push(error.message)
  }

  return results
}

// ==========================================
// CUSTOMERS
// ==========================================

// Fetch customers from Odyssey ERP
export async function fetchCustomers(options = {}) {
  const {
    customerId,
    name,
    active = true,
    limit = 500,
    offset = 0
  } = options

  let endpoint = '/api/customers'
  const params = new URLSearchParams()

  if (customerId) params.append('customerId', customerId)
  if (name) params.append('name', name)
  if (active !== undefined) params.append('active', active.toString())
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.customers || data.data || data
}

// ==========================================
// WORK CENTERS
// ==========================================

// Fetch work centers from Odyssey ERP
export async function fetchWorkCenters(options = {}) {
  const { active = true } = options

  let endpoint = '/api/work-centers'
  const params = new URLSearchParams()

  if (active !== undefined) params.append('active', active.toString())

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  const data = await odysseyFetch(endpoint)
  return data.workCenters || data.data || data
}

// ==========================================
// SYNC LOGGING
// ==========================================

async function logSync(entityType, results, durationMs) {
  if (!supabaseAdmin) return

  try {
    await supabaseAdmin.from('odyssey_sync_log').insert({
      entity_type: entityType,
      status: results.success ? (results.failed > 0 ? 'partial' : 'success') : 'failed',
      total_items: results.synced + results.failed,
      synced_items: results.synced,
      failed_items: results.failed,
      error_messages: results.errors.length > 0 ? results.errors : null,
      duration_ms: durationMs
    })
  } catch (error) {
    console.error('❌ Error logging sync:', error)
  }
}

// Get sync history
export async function getSyncHistory(options = {}) {
  if (!supabaseAdmin) {
    return []
  }

  const { entityType, limit = 50 } = options

  let query = supabaseAdmin
    .from('odyssey_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Error fetching sync history:', error)
    return []
  }

  return data || []
}

// ==========================================
// COMPREHENSIVE SYNC
// ==========================================

// Sync all data types from Odyssey ERP
export async function syncAll(options = {}) {
  const results = {
    products: null,
    shopOrders: null,
    productionHistory: null,
    inventory: null,
    totalSynced: 0,
    totalFailed: 0,
    errors: []
  }

  console.log('🔄 Starting comprehensive Odyssey ERP sync...')

  // Sync products
  try {
    results.products = await syncProducts(options.products || {})
    results.totalSynced += results.products.synced
    results.totalFailed += results.products.failed
    if (results.products.errors.length > 0) {
      results.errors.push(...results.products.errors.map(e => `Products: ${e}`))
    }
  } catch (error) {
    results.errors.push(`Products sync failed: ${error.message}`)
  }

  // Sync shop orders
  try {
    results.shopOrders = await syncShopOrders(options.shopOrders || {})
    results.totalSynced += results.shopOrders.synced
    results.totalFailed += results.shopOrders.failed
    if (results.shopOrders.errors.length > 0) {
      results.errors.push(...results.shopOrders.errors.map(e => `Shop Orders: ${e}`))
    }
  } catch (error) {
    results.errors.push(`Shop orders sync failed: ${error.message}`)
  }

  // Sync production history
  try {
    results.productionHistory = await syncProductionHistory(options.productionHistory || {})
    results.totalSynced += results.productionHistory.synced
    results.totalFailed += results.productionHistory.failed
    if (results.productionHistory.errors.length > 0) {
      results.errors.push(...results.productionHistory.errors.map(e => `Production: ${e}`))
    }
  } catch (error) {
    results.errors.push(`Production history sync failed: ${error.message}`)
  }

  // Sync inventory
  try {
    results.inventory = await syncInventory(options.inventory || {})
    results.totalSynced += results.inventory.synced
    results.totalFailed += results.inventory.failed
    if (results.inventory.errors.length > 0) {
      results.errors.push(...results.inventory.errors.map(e => `Inventory: ${e}`))
    }
  } catch (error) {
    results.errors.push(`Inventory sync failed: ${error.message}`)
  }

  console.log(`✅ Odyssey ERP sync complete: ${results.totalSynced} synced, ${results.totalFailed} failed`)

  return results
}

// ==========================================
// DATA LOOKUP FUNCTIONS
// ==========================================

// Get local products synced from Odyssey
export async function getOdysseyProducts(options = {}) {
  if (!supabaseAdmin) {
    throw new OdysseyERPError('Database not configured', 'DB_NOT_CONFIGURED')
  }

  const { search, category, limit = 100 } = options

  let query = supabaseAdmin
    .from('odyssey_products')
    .select('*')
    .eq('active', true)
    .order('product_number')
    .limit(limit)

  if (search) {
    query = query.or(`product_number.ilike.%${search}%,product_description.ilike.%${search}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    throw new OdysseyERPError(`Failed to fetch products: ${error.message}`, 'DB_ERROR', error)
  }

  return data || []
}

// Get local shop orders synced from Odyssey
export async function getOdysseyShopOrders(options = {}) {
  if (!supabaseAdmin) {
    throw new OdysseyERPError('Database not configured', 'DB_NOT_CONFIGURED')
  }

  const { status, search, limit = 100 } = options

  let query = supabaseAdmin
    .from('odyssey_shop_orders')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`job_number.ilike.%${search}%,part_number.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new OdysseyERPError(`Failed to fetch shop orders: ${error.message}`, 'DB_ERROR', error)
  }

  return data || []
}

// Get production history for a specific job
export async function getOdysseyProductionByJob(jobNumber) {
  if (!supabaseAdmin) {
    throw new OdysseyERPError('Database not configured', 'DB_NOT_CONFIGURED')
  }

  const { data, error } = await supabaseAdmin
    .from('odyssey_production_history')
    .select('*')
    .eq('job_number', jobNumber)
    .order('production_date', { ascending: false })

  if (error) {
    throw new OdysseyERPError(`Failed to fetch production history: ${error.message}`, 'DB_ERROR', error)
  }

  return data || []
}

// Test connection to Odyssey ERP
export async function testConnection() {
  try {
    console.log('🔍 Testing Odyssey ERP connection...')

    // Try to authenticate
    await authenticate()

    // Try a simple API call
    const workCenters = await fetchWorkCenters({ active: true })

    return {
      success: true,
      message: 'Connection successful',
      workCentersFound: workCenters.length
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: error.code
    }
  }
}
