const {calculate} = require('./_order');
module.exports = (req,res) => {
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try { return res.status(200).json(calculate(req.body)); }
  catch(err) { return res.status(400).json({error:err.message}); }
};
