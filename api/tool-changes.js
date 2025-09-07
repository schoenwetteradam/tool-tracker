// /api/tool-changes endpoint
app.post('/api/tool-changes', async (req, res) => {
  try {
    const toolChangeData = req.body;
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('tool_changes')
      .insert([toolChangeData]);
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
