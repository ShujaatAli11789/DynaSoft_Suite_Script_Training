/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/ui/dialog", "N/log"], function (dialog, log) {
  let originalPhone = "";
  let previousPhone = "";

  function pageInit(context) {
    let title = "pageInit ::";
    try {
      const customerRecord = context.currentRecord;
      const number = customerRecord.getValue({ fieldId: "phone" }).trim();

      originalPhone = number;
      previousPhone = number;
    } catch (e) {
      log.error({
        title: title + "Error",
        details: `There was a error while fetching the user's phone number, Error: ${e.message}`,
      });
    }
  }

  function fieldChanged(context) {
    let title = "fieldChanged :: ";
    try {
      if (context.fieldId != "phone") return;

      const customer = context.currentRecord;
      const newNumber = customer.getValue({ fieldId: "phone" }).trim();

      if (!newNumber) {
        previousPhone = "";
        return;
      }

      if (originalPhone && newNumber == originalPhone) {
        dialog.alert({
          title: "Duplicate Phone Number",
          message:
            "New phone number cannot be the same as the original phone number.",
        });

        customer.setValue({
          fieldId: "phone",
          value: "",
          ignoreFieldChange: true,
        });

        previousPhone = "";
        return;
      }

      if (previousPhone) {
        dialog.alert({
          title: "Phone Number Changed",
          message: `Phone number changed from ${previousPhone} to ${newNumber}.`,
        });
      } else {
        dialog.alert({
          title: "Phone Added",
          message: `Phone number ${newNumber} added to this record.`,
        });
      }

      previousPhone = newNumber;
    } catch (e) {
      log.error({
        title: title + "Error",
        details: `There was a error while changing the user's phone number, Error: ${e.message}`,
      });
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
  };
});
