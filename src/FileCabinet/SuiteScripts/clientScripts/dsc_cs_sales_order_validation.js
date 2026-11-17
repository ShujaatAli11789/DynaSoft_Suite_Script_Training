/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(["N/log", "N/ui/dialog"], function (log, dialog) {
  function pageInit(context) {
    const title = "pageInit :: ";
    try {
      const salesOrder = context.currentRecord;
      if (context.mode == "edit") {
        dialog.alert({
          title: "Greetings",
          message: `Welcome, You are currently editing record #${salesOrder.id}`,
        });
      } else if (context.mode == "create") {
        dialog.alert({
          title: "Greetings",
          message: `Welcome, You are currently creating a brand new sales record, kindly fill out all the necessary fields.`,
        });
      } else if (context.mode == "copy") {
        const urlParams = new URLSearchParams(window.location.search);
        const originalId = urlParams.get("id");
        dialog.alert({
          title: "Greetings",
          message: `Welcome, You are currently creating a copy of existing sales record #${originalId}.`,
        });
      }
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
    }
  }

  function fieldChanged(context) {
    const title = "fieldChanged :: ";

    try {
      const salesOrder = context.currentRecord;
      if (context.fieldId == "entity") {
        const customerName = salesOrder.getText({
          fieldId: "entity",
        });
        const customerInternalId = salesOrder.getValue({
          fieldId: "entity",
        });

        const subsidiaryName = salesOrder.getText({
          fieldId: "subsidiary",
        });

        dialog.alert({
          title: "Information Changed",
          message: `Customer: (${customerInternalId}) ${customerName}\nSubsidairy: ${subsidiaryName}`,
        });
      }
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
    }
  }
  function validateLine(context) {
    const title = "validateLine :: ";
    try {
      const salesOrder = context.currentRecord;
      if (context.sublistId == "item") {
        const quantity = salesOrder.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        });
        // if (isNaN(quantity)) {
        //   dialog.alert({
        //     title: "Invalid Quantity",
        //     message: `Please enter a valid numeric quantity.`,
        //   });
        //   return false;
        // }
        if (!quantity || quantity <= 0) {
          dialog.alert({
            title: "Invalid Quantity",
            message: `Please enter a valid quantity, you must add atleast 1 in the item quantity.`,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
      return true;
    }
  }

  function saveRecord(context) {
    const title = "saveRecord :: ";
    try {
      const salesOrder = context.currentRecord;
      const customer = salesOrder.getValue({
        fieldId: "entity",
      });
      const addedItem = salesOrder.getLineCount({
        sublistId: "item",
      });

      if (!customer) {
        dialog.alert({
          title: "Invalid Customer",
          message: `Please select a valid customer.`,
        });
        return false;
      } else if (addedItem == 0) {
        dialog.alert({
          title: "Empty item List",
          message: `Please enter at least 1 item to proceed.`,
        });
        return false;
      } else {
        return true;
      }
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
      return true;
    }
  }
  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    validateLine: validateLine,
    saveRecord: saveRecord,
  };
});
