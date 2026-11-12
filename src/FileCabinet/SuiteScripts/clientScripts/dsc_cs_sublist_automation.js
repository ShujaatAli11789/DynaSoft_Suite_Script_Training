/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/record", "N/ui/dialog", "N/log"], function (record, dialog, log) {
  let isNewItemSelected = false;

  function fieldChanged(context) {
    let title = "fieldChanged ::";
    try {
      if (context.sublistId == "item" && context.fieldId == "item") {
        const itemId = context.currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
        });

        if (itemId) isNewItemSelected = true;
      }
    } catch (e) {
      log.error({
        title: title + "Error",
        details: e.message,
      });
    }
  }

  function postSourcing(context) {
    let title = "postSourcing ::";
    try {
      if (
        context.sublistId === "item" &&
        context.fieldId === "item" &&
        isNewItemSelected
      ) {
        isNewItemSelected = false;

        const salesOrder = context.currentRecord;
        const itemId = salesOrder.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
        });

        if (!itemId) return;

        const itemRec = record.load({
          type: record.Type.INVENTORY_ITEM,
          id: itemId,
        });

        const customRate = itemRec.getValue({
          fieldId: "custitem_custom_rate",
        });

        const currentQty = salesOrder.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        });

        if (!currentQty) {
          salesOrder.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: 1,
            fireSlavingSync: true,
          });
        }

        if (!customRate && customRate != 0) {
          log.audit({
            title: "Missing Custom Rate",
            details: `Item ID ${itemId} does not have custitem_custom_rate populated.`,
          });
          dialog.alert({
            title: "Custom Rate Error",
            message: "There is no custom rate set for this item.",
          });
        } else {
          salesOrder.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "price",
            value: -1,
            fireSlavingSync: true,
          });

          salesOrder.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: customRate,
            fireSlavingSync: true,
          });

          log.debug({
            title: "Custom Rate Applied",
            details: `Set custom rate of ${customRate} for Item ID: ${itemId}`,
          });
        }
      }
    } catch (e) {
      isNewItemSelected = false;
      log.error({
        title: title + "Error",
        details: e.message,
      });
      dialog.alert({
        title: "Script Error",
        message: `An error occurred while fetching the item rate: ${e.message}`,
      });
    }
  }

  return {
    fieldChanged: fieldChanged,
    postSourcing: postSourcing,
  };
});
