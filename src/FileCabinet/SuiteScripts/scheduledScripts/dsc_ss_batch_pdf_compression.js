/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(["N/search", "N/log", "N/render", "N/compress", "N/file"], function (
  search,
  log,
  render,
  compress,
  file,
) {
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
        end: 20,
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

      const archiver = compress.createArchiver();
      invoices.forEach((invoice) => {
        const id = invoice.id;

        let pdf = render.transaction({
          entityId: Number(id),
          printMode: render.PrintMode.PDF,
        });

        pdf.name = `Invoice_${id}.pdf`;
        originalSize += pdf.size;

        archiver.add({
          file: pdf,
        });
      });

      const zipFile = archiver.archive({
        name: "dsc_pdf_zips_batch.zip",
        type: compress.Type.ZIP,
      });

      zipFile.folder = 13663;
      const fileId = zipFile.save();
      const saved_file = file.load({ id: fileId });
      log.audit({
        title: "Size Comparison",
        details: `FileId:${saved_file.id} | File Name: ${saved_file.name} | Before: ${originalSize} | After: ${zipFile.size}`,
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
