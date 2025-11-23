-- Migration: Add Odyssey ERP Integration Tables
-- Purpose: Store synced data from Odyssey ERP cloud system
-- API: api.blinfo.com/SPUNCAST

-- ==========================================
-- ODYSSEY PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_products (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Product identification
    product_number TEXT NOT NULL UNIQUE,
    product_description TEXT,
    category TEXT,

    -- Product details
    unit_of_measure TEXT,
    unit_weight NUMERIC(10, 4),
    unit_cost NUMERIC(10, 4),
    active BOOLEAN DEFAULT true,

    -- Odyssey ERP reference
    odyssey_item_id TEXT,
    last_synced TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_odyssey_products_number ON odyssey_products(product_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_products_category ON odyssey_products(category);
CREATE INDEX IF NOT EXISTS idx_odyssey_products_active ON odyssey_products(active);

-- ==========================================
-- ODYSSEY SHOP ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_shop_orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Order identification
    job_number TEXT NOT NULL UNIQUE,
    part_number TEXT,
    description TEXT,

    -- Quantities
    quantity_ordered INTEGER DEFAULT 0,
    quantity_completed INTEGER DEFAULT 0,
    quantity_remaining INTEGER DEFAULT 0,

    -- Status and priority
    status TEXT DEFAULT 'Open',
    priority TEXT DEFAULT 'Normal',

    -- Dates
    start_date DATE,
    due_date DATE,
    completion_date DATE,

    -- Additional details
    work_center TEXT,
    customer TEXT,
    customer_po TEXT,
    notes TEXT,

    -- Odyssey ERP reference
    odyssey_order_id TEXT,
    last_synced TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_odyssey_orders_job ON odyssey_shop_orders(job_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_orders_part ON odyssey_shop_orders(part_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_orders_status ON odyssey_shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_odyssey_orders_due_date ON odyssey_shop_orders(due_date);

-- ==========================================
-- ODYSSEY PRODUCTION HISTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_production_history (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Production identification
    job_number TEXT,
    operation_number TEXT,
    part_number TEXT,
    work_center TEXT,

    -- Quantities
    quantity_produced INTEGER DEFAULT 0,
    quantity_scrapped INTEGER DEFAULT 0,

    -- Production details
    production_date DATE,
    shift TEXT,
    operator TEXT,
    machine TEXT,

    -- Time tracking
    setup_hours NUMERIC(8, 2) DEFAULT 0,
    run_hours NUMERIC(8, 2) DEFAULT 0,
    labor_hours NUMERIC(8, 2) DEFAULT 0,

    notes TEXT,

    -- Odyssey ERP reference
    odyssey_production_id TEXT UNIQUE,
    last_synced TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_odyssey_production_job ON odyssey_production_history(job_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_production_part ON odyssey_production_history(part_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_production_date ON odyssey_production_history(production_date);
CREATE INDEX IF NOT EXISTS idx_odyssey_production_work_center ON odyssey_production_history(work_center);

-- ==========================================
-- ODYSSEY INVENTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_inventory (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Item identification
    item_number TEXT NOT NULL,
    description TEXT,
    warehouse TEXT,
    location TEXT,

    -- Quantities
    quantity_on_hand NUMERIC(12, 4) DEFAULT 0,
    quantity_available NUMERIC(12, 4) DEFAULT 0,
    quantity_allocated NUMERIC(12, 4) DEFAULT 0,
    quantity_on_order NUMERIC(12, 4) DEFAULT 0,

    -- Costing
    unit_cost NUMERIC(10, 4),
    total_value NUMERIC(12, 2),

    -- Dates
    last_receipt_date DATE,

    -- Odyssey ERP reference
    odyssey_inventory_id TEXT,
    last_synced TIMESTAMPTZ,

    -- Composite unique constraint
    UNIQUE(item_number, warehouse, location)
);

CREATE INDEX IF NOT EXISTS idx_odyssey_inventory_item ON odyssey_inventory(item_number);
CREATE INDEX IF NOT EXISTS idx_odyssey_inventory_warehouse ON odyssey_inventory(warehouse);

-- ==========================================
-- ODYSSEY SYNC LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_sync_log (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Sync details
    entity_type TEXT NOT NULL,  -- 'products', 'shop_orders', 'production_history', 'inventory'
    status TEXT NOT NULL,       -- 'success', 'partial', 'failed'

    -- Counts
    total_items INTEGER DEFAULT 0,
    synced_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,

    -- Error tracking
    error_messages TEXT[],

    -- Performance
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_odyssey_sync_entity ON odyssey_sync_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_odyssey_sync_status ON odyssey_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_odyssey_sync_created ON odyssey_sync_log(created_at DESC);

-- ==========================================
-- ODYSSEY ERP MAPPINGS TABLE
-- Maps local entities to Odyssey ERP entities for bidirectional sync
-- ==========================================
CREATE TABLE IF NOT EXISTS odyssey_erp_mappings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Local entity reference
    local_entity_type TEXT NOT NULL,  -- 'tool_change', 'pour_report', 'equipment'
    local_id BIGINT NOT NULL,

    -- Odyssey ERP entity reference
    odyssey_entity_type TEXT,
    odyssey_entity_id TEXT NOT NULL,

    -- Sync metadata
    sync_direction TEXT,  -- 'pull', 'push', 'bidirectional'
    last_synced TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'synced',  -- 'pending', 'synced', 'failed', 'conflict'

    UNIQUE(odyssey_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_odyssey_mappings_local ON odyssey_erp_mappings(local_entity_type, local_id);
CREATE INDEX IF NOT EXISTS idx_odyssey_mappings_odyssey ON odyssey_erp_mappings(odyssey_entity_id);

-- ==========================================
-- ROW-LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all Odyssey tables
ALTER TABLE odyssey_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_production_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_erp_mappings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on odyssey_products"
    ON odyssey_products FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on odyssey_shop_orders"
    ON odyssey_shop_orders FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on odyssey_production_history"
    ON odyssey_production_history FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on odyssey_inventory"
    ON odyssey_inventory FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on odyssey_sync_log"
    ON odyssey_sync_log FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on odyssey_erp_mappings"
    ON odyssey_erp_mappings FOR SELECT
    USING (true);

-- Allow service role full access for writes
CREATE POLICY "Allow service role write on odyssey_products"
    ON odyssey_products FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on odyssey_shop_orders"
    ON odyssey_shop_orders FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on odyssey_production_history"
    ON odyssey_production_history FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on odyssey_inventory"
    ON odyssey_inventory FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on odyssey_sync_log"
    ON odyssey_sync_log FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on odyssey_erp_mappings"
    ON odyssey_erp_mappings FOR ALL
    USING (auth.role() = 'service_role');

-- ==========================================
-- HELPER VIEWS
-- ==========================================

-- View for active shop orders with remaining work
CREATE OR REPLACE VIEW odyssey_open_orders AS
SELECT
    job_number,
    part_number,
    description,
    quantity_ordered,
    quantity_completed,
    quantity_remaining,
    status,
    priority,
    due_date,
    work_center,
    customer,
    CASE
        WHEN due_date < CURRENT_DATE THEN 'overdue'
        WHEN due_date = CURRENT_DATE THEN 'due_today'
        WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_this_week'
        ELSE 'upcoming'
    END as urgency
FROM odyssey_shop_orders
WHERE status NOT IN ('Completed', 'Closed', 'Cancelled')
    AND quantity_remaining > 0
ORDER BY
    CASE priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Normal' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5
    END,
    due_date ASC;

-- View for production summary by work center
CREATE OR REPLACE VIEW odyssey_production_by_work_center AS
SELECT
    work_center,
    production_date,
    COUNT(*) as operation_count,
    SUM(quantity_produced) as total_produced,
    SUM(quantity_scrapped) as total_scrapped,
    SUM(setup_hours) as total_setup_hours,
    SUM(run_hours) as total_run_hours,
    SUM(labor_hours) as total_labor_hours,
    CASE
        WHEN SUM(quantity_produced) + SUM(quantity_scrapped) > 0
        THEN ROUND(SUM(quantity_scrapped)::numeric / (SUM(quantity_produced) + SUM(quantity_scrapped)) * 100, 2)
        ELSE 0
    END as scrap_percentage
FROM odyssey_production_history
GROUP BY work_center, production_date
ORDER BY production_date DESC, work_center;

-- View for recent sync status
CREATE OR REPLACE VIEW odyssey_sync_status AS
SELECT
    entity_type,
    status as last_status,
    synced_items as last_synced_count,
    failed_items as last_failed_count,
    created_at as last_sync_time,
    duration_ms as last_duration_ms
FROM odyssey_sync_log
WHERE (entity_type, created_at) IN (
    SELECT entity_type, MAX(created_at)
    FROM odyssey_sync_log
    GROUP BY entity_type
)
ORDER BY entity_type;

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_odyssey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_odyssey_products_updated_at
    BEFORE UPDATE ON odyssey_products
    FOR EACH ROW
    EXECUTE FUNCTION update_odyssey_updated_at();

CREATE TRIGGER update_odyssey_shop_orders_updated_at
    BEFORE UPDATE ON odyssey_shop_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_odyssey_updated_at();

CREATE TRIGGER update_odyssey_inventory_updated_at
    BEFORE UPDATE ON odyssey_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_odyssey_updated_at();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE odyssey_products IS 'Products/items synced from Odyssey ERP';
COMMENT ON TABLE odyssey_shop_orders IS 'Shop orders/work orders synced from Odyssey ERP';
COMMENT ON TABLE odyssey_production_history IS 'Production history records synced from Odyssey ERP';
COMMENT ON TABLE odyssey_inventory IS 'Inventory levels synced from Odyssey ERP';
COMMENT ON TABLE odyssey_sync_log IS 'Log of all sync operations with Odyssey ERP';
COMMENT ON TABLE odyssey_erp_mappings IS 'Mappings between local and Odyssey ERP entities for bidirectional sync';
