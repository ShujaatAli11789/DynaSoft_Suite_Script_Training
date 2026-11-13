/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/ui/dialog", "N/log"], function (dialog, log) {
  let originalPhone = "";
  let previousPhone = "";

  function pageInit(context) {
    let title = "pageInit :: ";
    try {
      const customerRecord = context.currentRecord;
      const number = (
        customerRecord.getValue({ fieldId: "phone" }) || ""
      ).trim();

      originalPhone = number;
      previousPhone = number;
    } catch (e) {
      log.error({
        title: title + "Error",
        details: `There was an error while fetching the user's phone number, Error: ${e.message}`,
      });
    }
  }

  function validatePhoneNum(phoneNum) {
    phoneNum = phoneNum.trim();

    let digitsOnly = phoneNum.startsWith("+") ? phoneNum.slice(1) : phoneNum;

    if (digitsOnly.length < 10) {
      return {
        isValid: false,
        message: "Phone Number must be at least 10 digits.",
      };
    }

    for (let i = 0; i < digitsOnly.length; i++) {
      if (digitsOnly[i] < "0" || digitsOnly[i] > "9") {
        return {
          isValid: false,
          message:
            "Phone Number must contain numeric digits only and an optional '+'.",
        };
      }
    }

    return { isValid: true };
  }

  function validateField(context) {
    let title = "validateField :: ";
    const customer = context.currentRecord;

    if (context.fieldId === "phone") {
      try {
        let phoneNum = customer.getValue({ fieldId: "phone" });

        if (!phoneNum || phoneNum.trim().length === 0) {
          return true;
        }

        let checkNum = validatePhoneNum(phoneNum);
        if (!checkNum.isValid) {
          alert(checkNum.message);

          customer.setValue({
            fieldId: "phone",
            value: "",
            ignoreFieldChange: true,
          });

          return false;
        }

        return true;
      } catch (error) {
        log.error({
          title: title + "Phone Error",
          details: error.message,
        });
      }
    }

    return true;
  }

  function fieldChanged(context) {
    let title = "fieldChanged :: ";
    try {
      if (context.fieldId !== "phone") return;

      const customer = context.currentRecord;
      const newNumber = (customer.getValue({ fieldId: "phone" }) || "").trim();

      if (!newNumber) {
        previousPhone = "";
        return;
      }

      if (originalPhone && newNumber === originalPhone) {
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
        details: `There was an error while changing the user's phone number, Error: ${e.message}`,
      });
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    validateField: validateField,
  };
});
