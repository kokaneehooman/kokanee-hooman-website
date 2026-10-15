const {list} = require('@vercel/blob');
function csvCell(value) { const s=String(value??''); return '"'+s.replace(/"/g,'""')+'"'; }
module.exports = async (req,res) => {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const expected=process.env.ORDER_EXPORT_TOKEN;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) return res.status(401).json({error:'Unauthorized'});
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({error:'Storage not configured'});
  try {
    const rows=[];let cursor;
    do {
      const page=await list({prefix:'orders/',limit:1000,...(cursor?{cursor}:{})});
      for (const blob of page.blobs) {
        const response=await fetch(blob.url,{cache:'no-store'});
        if (!response.ok) throw Error('Unable to read saved order');
        const order=await response.json();
        for (const item of order.items) rows.push({orderId:order.orderId,orderNumber:order.orderNumber||order.orderId,orderDate:order.orderDate||'',orderTime:order.orderTime||'',timeZone:order.timeZone||'Asia/Kolkata',createdAt:order.createdAt,currency:order.currency||'INR',status:order.status,fulfillmentType:order.fulfillmentType||(order.delivery?'delivery':'pickup'),paymentMethod:order.paymentMethod||'UPI',paymentStatus:order.paymentStatus||'pending',invoiceNumber:order.invoiceNumber||'',invoiceDate:order.invoiceDate||'',customerName:order.customerName||'',customerPhone:order.customerPhone||'',customerAddress:order.customerAddress||'',itemId:item.id,itemName:item.name,quantity:item.quantity,unitPrice:item.price,lineTotal:item.total,orderSubtotal:order.subtotal,packaging:order.packaging,delivery:order.delivery,grandTotal:order.total});
      }
      cursor=page.hasMore?page.cursor:undefined;
    } while(cursor);
    const columns=['orderId','orderNumber','orderDate','orderTime','timeZone','createdAt','currency','status','fulfillmentType','paymentMethod','paymentStatus','invoiceNumber','invoiceDate','customerName','customerPhone','customerAddress','itemId','itemName','quantity','unitPrice','lineTotal','orderSubtotal','packaging','delivery','grandTotal'];
    const csv='\uFEFF'+columns.join(',')+'\r\n'+rows.map(row=>columns.map(k=>csvCell(row[k])).join(',')).join('\r\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="kokanee-hooman-orders.csv"');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(csv);
  } catch(err) { console.error('Export failed',err); return res.status(500).json({error:'Could not export orders'}); }
};
