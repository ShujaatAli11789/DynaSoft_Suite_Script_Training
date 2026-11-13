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

      let poCheck = customerRecord.getValue({
        fieldId: "custentity_dsc_requires_po",
      });
      let poNum = customerRecord.getField({
        fieldId: "custentity_dsc_po_number",
      });
      if (!poCheck && poNum) {
        poNum.isDisabled = true;
      }
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
      if (context.fieldId == "custentity_dsc_requires_po") {
        const customer = context.currentRecord;
        let poCheck = customer.getValue({
          fieldId: "custentity_dsc_requires_po",
        });
        let poNum = customer.getField({
          fieldId: "custentity_dsc_po_number",
        });

        if (poCheck && poNum) {
          poNum.isDisabled = false;
        }
        if (!poCheck && poNum) {
          customer.setValue({
            fieldId: "custentity_dsc_po_number",
            value: "",
          });
          poNum.isDisabled = true;
        }
      }

      if (context.fieldId == "phone") {
        const customer = context.currentRecord;
        const newNumber = (
          customer.getValue({ fieldId: "phone" }) || ""
        ).trim();

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
      }
    } catch (e) {
      log.error({
        title: title + "Error",
        details: `There was an error while changing the user's phone number, Error: ${e.message}`,
      });
    }
  }

  function saveRecord(context) {
    let title = "saveRecord :: ";
    try {
      const customer = context.currentRecord;
      const poCheck = customer.getValue({
        fieldId: "custentity_dsc_requires_po",
      });
      const poNum = customer.getValue({
        fieldId: "custentity_dsc_po_number",
      });

      let trimmedPoNum = poNum ? poNum.trim() : "";

      if (poCheck && trimmedPoNum.length == 0) {
        alert(
          "PO Number is required, either enter the PO Number or uncheck Requires PO.",
        );
        return false;
      }

      return true;
    } catch (error) {
      log.error({
        title: title + "Error",
        details: error.message,
      });
      return false;
    }
  }
  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    validateField: validateField,
    saveRecord: saveRecord,
  };
});
