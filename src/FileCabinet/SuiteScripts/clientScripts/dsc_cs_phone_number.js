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

  function validateField(context) {
    let title = "validateField ::";
    const customer = context.currentRecord;

    if (context.fieldId === "phone") {
      try {
        let number = customer.getValue({
          fieldId: "phone",
        });

        if (!number) return true;

        number = number.trim();
        if (number.length === 0) return true;

        let digitsOnly = number.startsWith("+") ? number.slice(1) : number;

        if (digitsOnly.length < 10) {
          dialog.alert({
            title: "Invalid Phone Number",
            message: "Phone number must contain at least 10 digits.",
          });
          return false;
        }

        const digits = digitsOnly.split("");
        digits.forEach((digit) => {
          if (digit < "0" || digit > "9") {
            dialog.alert({
              title: "Invalid Phone Number",
              message:
                "Phone number must contain only numeric digits and an optional '+' prefix.",
            });
            return false;
          }
        });

        return true;
      } catch (error) {
        log.debug({
          title: title + "Error",
          details: error.message,
        });
      }
    }

    if (context.fieldId === "email") {
      try {
        let email = customer.getValue({
          fieldId: "email",
        });
        if (!email) return true;

        email = email.trim();
        if (email.length === 0) return true;

        if (email.includes(" ")) {
          dialog.alert({
            title: "Invalid Email Address",
            message: "Email address cannot contain spaces.",
          });
          return false;
        }

        const parts = email.split("@");
        if (parts.length != 2) {
          dialog.alert({
            title: "Invalid Email Address",
            message: "Email address must contain a single '@' symbol.",
          });
          return false;
        }

        const addressPart = parts[0];
        const domainPart = parts[1];

        const dotIndex = domainPart.indexOf(".");
        if (
          addressPart.length == 0 ||
          domainPart.length < 3 ||
          dotIndex <= 0 ||
          domainPart.endsWith(".")
        ) {
          dialog.alert({
            title: "Invalid Email Address",
            message:
              "Please enter a valid email address (e.g., user@example.com).",
          });
          return false;
        }

        return true;
      } catch (error) {
        log.debug({
          title: title + "Error",
          details: error.message,
        });
      }
    }
    return true;
  }
  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    validateField: validateField,
  };
});
