# Kokanee Hooman menu website

Mobile-first chalkboard menu, plain HTML/CSS/JavaScript and two Vercel Node serverless endpoints. No build step or dependencies.

## Deploy

Push this folder to a GitHub repository. In Vercel, import the repository, choose **Other** as the framework preset, leave the build command empty, and deploy. The root directory should be the folder containing `index.html`, `api/` and `data/`.

## Update menu prices

Edit `data/menu.json` and redeploy. Both `/api/menu` and `/api/validate-order` use this single server-side file. The browser never submits its own price as authoritative. The JSON is not directly served from the public root; its menu items are publicly readable through `/api/menu`.

Packaging is ₹10 per quantity item (so 1 item ₹10, 2 items ₹20, 3 items ₹30). Optional delivery is a flat ₹40. The packaging formula is not explained on the website.

## Test locally

Use `npx vercel dev` (requires Vercel CLI) to run both static files and API functions. Opening `index.html` directly as a file will not load the API.

## Important limitation

The server verifies prices before constructing the WhatsApp message, but customers can manually edit WhatsApp text afterward. Always confirm the received order before fulfilling it.

## JSON order logging and CSV export

This version records each order **when the customer clicks Order on WhatsApp**, after the server verifies all prices, **before** opening WhatsApp. Each JSON record has `status: "whatsapp_opened"`; this does **not** mean the WhatsApp message was actually sent or accepted.

1. In Vercel, connect a **Vercel Blob** store to the project so `BLOB_READ_WRITE_TOKEN` is available to the serverless functions. Install dependencies via `npm install` (Vercel installs them automatically on deployment).
2. Add a long random `ORDER_EXPORT_TOKEN` in Vercel project environment variables. Never put this token in client-side JavaScript or a public file.
3. Redeploy. Orders will be saved as individual JSON objects at `orders/KH-....json` in Blob storage. Saving must succeed before WhatsApp opens; if saving fails, checkout displays an error.
4. To download the CSV (one row per ordered dish), run:

   ```sh
   curl -f -H "Authorization: Bearer YOUR_ORDER_EXPORT_TOKEN" \
     "https://YOUR-DOMAIN.vercel.app/api/export-orders" \
     -o kokanee-hooman-orders.csv
   ```

The CSV repeats order-level charges on each item row. When analyzing totals, **do not sum grandTotal across item rows**; deduplicate by `orderId` first.

**Privacy note:** This lightweight implementation uses publicly readable Vercel Blob objects with unguessable URLs, but anyone possessing an object URL could read it. The order JSON deliberately excludes customer names, addresses, phone numbers, and payment information. The CSV export endpoint itself requires the private `ORDER_EXPORT_TOKEN`. If order data needs to be confidential, switch to private Blob storage or a private database.

## Order date, payment and CSV fields

At checkout, customers enter name and phone number; delivery orders additionally require an address. These details are included in the WhatsApp message but **not stored in the publicly readable Blob order JSON**. The stored record has blank customer fields so the export schema remains useful for later migration to private storage.

The server timestamps each order at checkout (`createdAt` ISO UTC, `orderDate` YYYY-MM-DD and `orderTime` HH:mm:ss in `Asia/Kolkata`). Order ID is also the provisional order number. `invoiceNumber` and `invoiceDate` remain blank because an opened WhatsApp checkout is not an issued invoice. `currency` is INR, `paymentMethod` is UPI and `paymentStatus` is pending. The status stays `whatsapp_opened` even if the customer does not send the WhatsApp message.

CSV is **one row per line item** with repeated order totals. For order-level sales analysis, group by `orderId` and avoid summing repeated grand totals. This is a practical Zoho-style export schema, not a guaranteed Zoho Books import template; importing into Zoho Books requires mapping fields to its specific import format.
