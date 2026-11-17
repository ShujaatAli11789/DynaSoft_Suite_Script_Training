/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define([
  "N/search",
  "N/log",
  "N/render",
  "N/file",
  "/SuiteScripts/Compressing JS Libraries/fflate.min.js",
], function (search, log, render, file, fflate) {
  // --- HELPER FUNCTIONS FOR SERVER-SIDE BASE64 CONVERSION ---
  function base64ToUint8Array(base64) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === "=") bufferLength--;
    if (base64[base64.length - 2] === "=") bufferLength--;

    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
      let encoded1 = lookup[base64.charCodeAt(i)];
      let encoded2 = lookup[base64.charCodeAt(i + 1)];
      let encoded3 = lookup[base64.charCodeAt(i + 2)];
      let encoded4 = lookup[base64.charCodeAt(i + 3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes;
  }

  function uint8ArrayToBase64(bytes) {
    let result = "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;
    let a, b, c, d, chunk;

    for (let i = 0; i < mainLength; i += 3) {
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      a = (chunk & 16515072) >> 18;
      b = (chunk & 258048) >> 12;
      c = (chunk & 4032) >> 6;
      d = chunk & 63;
      result += chars[a] + chars[b] + chars[c] + chars[d];
    }

    if (byteRemainder === 1) {
      chunk = bytes[mainLength];
      a = (chunk & 252) >> 2;
      b = (chunk & 3) << 4;
      result += chars[a] + chars[b] + "==";
    } else if (byteRemainder === 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
      a = (chunk & 64512) >> 10;
      b = (chunk & 1008) >> 4;
      c = (chunk & 15) << 2;
      result += chars[a] + chars[b] + chars[c] + "=";
    }
    return result;
  }
  // --------------------------------------------------------

  function execute() {
    let title = "execute :: ";
    try {
      const invSearch = search.create({
        type: search.Type.INVOICE,
        filters: [
          search.createFilter({
            name: "salesrep",
            operator: search.Operator.IS,
            values: 214,
          }),
          search.createFilter({
            name: "mainline",
            operator: search.Operator.IS,
            values: "T",
          }),
        ],
      });

      const invoices = invSearch.run().getRange({
        start: 0,
        end: 30,
      });

      if (!invoices || invoices.length === 0) {
        log.audit({
          title: "Search Completed",
          details: "There are no Invoices in this criteria.",
        });
        return;
      }

      log.audit({
        title: "Search Execution",
        details: `Total Invoices retrieved: ${invoices.length}`,
      });

      let originalSize = 0;
      let zipData = {};

      invoices.forEach((invoice) => {
        const id = invoice.id;
        try {
          let pdf = render.transaction({
            entityId: Number(id),
            printMode: render.PrintMode.PDF,
          });

          pdf.name = `Invoice_${id}.pdf`;
          originalSize += pdf.size;

          // 1. Get the base64 string from the NetSuite PDF
          const base64String = pdf.getContents();

          // 2. Use our custom function to convert Base64 directly to Uint8Array for fflate
          const bytes = base64ToUint8Array(base64String);

          // 3. Assign the byte array to the filename key in our object
          zipData[pdf.name] = bytes;
        } catch (err) {
          log.error({
            title: `Error rendering invoice ID: ${id}`,
            details: err.message,
          });
        }
      });

      // Compress all the files synchronously
      const zippedBytes = fflate.zipSync(zipData, { level: 9 });

      // Convert the compressed Uint8Array back to a Base64 string using our custom function
      const zipBase64 = uint8ArrayToBase64(zippedBytes);

      const zipFile = file.create({
        name: "dsc_pdf_zips_batch_fflate.zip",
        fileType: file.Type.ZIP,
        contents: zipBase64,
        folder: 13663,
      });

      const fileId = zipFile.save();
      const saved_file = file.load({ id: fileId });

      log.audit({
        title: "Size Comparison",
        details: `File Id: ${saved_file.id} | File Name: ${saved_file.name} | Before: ${(originalSize / 1024 / 1024).toFixed(2)} Mbs | After: ${(zipFile.size / 1024 / 1024).toFixed(2)} Mbs`,
      });
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
    }
  }

  return {
    execute: execute,
  };
});
