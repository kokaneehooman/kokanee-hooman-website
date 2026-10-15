const {randomUUID} = require('node:crypto');
const {put} = require('@vercel/blob');
const {calculate} = require('./_order');
module.exports = async (req,res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  let order;
  try { order = calculate(req.body); }
  catch(err) { return res.status(400).json({error:err.message}); }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({error:'Order logging is not configured. Please contact the restaurant.'});
  const id = `KH-${Date.now()}-${randomUUID().slice(0,8)}`;
  const now = new Date();
  const ist = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const parts = Object.fromEntries(ist.map(x=>[x.type,x.value]));
  const orderDate = `${parts.year}-${parts.month}-${parts.day}`;
  const orderTime = `${parts.hour}:${parts.minute}:${parts.second}`;
  const record = {orderId:id,orderNumber:id,createdAt:now.toISOString(),orderDate,orderTime,timeZone:'Asia/Kolkata',currency:'INR',status:'whatsapp_opened',paymentMethod:'UPI',paymentStatus:'pending',fulfillmentType:req.body.delivery?'delivery':'pickup',invoiceNumber:null,invoiceDate:null,customerName:null,customerPhone:null,customerAddress:null,...order};
  try {
    // Personal customer details are intentionally not persisted in publicly readable Blob objects.
    // Blob URLs are unguessable but public if someone obtains the URL.
    await put(`orders/${id}.json`, JSON.stringify(record), {access:'public',addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60});
    res.setHeader('Cache-Control','no-store');
    return res.status(201).json(record);
  } catch(err) {
    console.error('Order save failed',err);
    return res.status(503).json({error:'Could not save order. Please try again.'});
  }
};
