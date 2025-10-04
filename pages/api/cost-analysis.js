import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  const { startDate, endDate, partNumber } = req.query

  const { data, error } = await supabase
    .from('tool_change_costs')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('part_number', partNumber)

  if (error) return res.status(500).json({ error: error.message })

  const totalCost = data.reduce((sum, item) => sum + (item.tool_unit_cost || 0), 0)
  const totalPieces = data.reduce((sum, item) => sum + (item.pieces_produced || 0), 0)

  res.json({
    toolingCostPerPiece: totalPieces ? totalCost / totalPieces : 0,
    totalToolingCost: totalCost,
    totalPieces,
    changes: data.length,
  })
}
