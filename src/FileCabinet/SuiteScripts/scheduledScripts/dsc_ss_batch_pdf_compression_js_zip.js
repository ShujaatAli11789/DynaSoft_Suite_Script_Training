/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define([
  "N/search",

  "N/render",
  "N/file",
  "/SuiteScripts/Compressing JS Libraries/jszip.min.js",
], function (search, render, file, JSZip) {
  async function execute() {
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

      if (typeof setImmediate === "undefined") {
        globalThis.setImmediate = function (callback) {
          return Promise.resolve().then(callback);
        };
      }
      const zip = new JSZip();

      invoices.forEach((invoice) => {
        const id = invoice.id;
        try {
          let pdf = render.transaction({
            entityId: Number(id),
            printMode: render.PrintMode.PDF,
          });
          pdf.name = `Invoice_${id}.pdf`;
          originalSize += pdf.size;

          zip.file(pdf.name, pdf.getContents(), {
            base64: true,
            compression: "DEFLATE",
            compressionOptions: { level: 9 },
          });
        } catch (err) {
          log.error({
            title: `Error rendering invoice ID: ${id}`,
            details: err.message,
          });
        }
      });

      const zipBase64 = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      const zipFile = file.create({
        name: "dsc_pdf_zips_batch_jszip.zip",
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
