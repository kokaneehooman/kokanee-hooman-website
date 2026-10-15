const menu = require('../data/menu.json');
const lookup = new Map(menu.categories.flatMap(c => c.items.map(([id,name,price]) => [id,{id,name,price}])));
function calculate(body) {
  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 42 || typeof body.delivery !== 'boolean') throw Error('Invalid order');
  const seen = new Set(); let quantity = 0, subtotal = 0; const items = [];
  for (const line of body.items) {
    if (!line || typeof line.id !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50 || seen.has(line.id) || !lookup.has(line.id)) throw Error('Invalid item or quantity');
    seen.add(line.id); quantity += line.quantity;
    if (quantity > 100) throw Error('Too many items');
    const item = lookup.get(line.id), total = item.price * line.quantity;
    subtotal += total; items.push({...item, quantity:line.quantity, total});
  }
  const packaging = quantity * menu.packagingPerItem;
  const delivery = body.delivery ? menu.deliveryCharge : 0;
  return {items,quantity,subtotal,packaging,delivery,total:subtotal+packaging+delivery};
}
module.exports = {calculate};
