export const predictToolLife = (toolType, insertType, historicalData) => {
  const recentChanges = historicalData
    .filter((change) => change.tool_type === toolType && change.insert_type === insertType)
    .slice(-10)

  const averageLife =
    recentChanges.reduce((sum, change) => sum + (change.pieces_produced || 0), 0) /
    (recentChanges.length || 1)

  return {
    predictedLife: Math.round(averageLife),
    confidence: recentChanges.length >= 5 ? 'High' : 'Low',
    recommendation: averageLife > 200 ? 'Optimal' : 'Review Settings',
  }
}
