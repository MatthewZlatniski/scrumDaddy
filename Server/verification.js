const express = require("express");
const router = express.Router();

module.exports = (app, con) => {

  /* api endpoint for the verification submission */
  app.post("/verification", async (req, res) => {
    try {
      const email = req.body.email;
      const verificationCode = req.body.verificationCode;
      console.log("Got verification request:", { email, verificationCode });

      // check that all fields have been filled out
      if (!email || !verificationCode) {
        return res.status(200).json({ success: true, message: "Please provide input for all fields."});
      }

      // check that the email has been registered
      const emailResult = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);
      if (emailResult.length == 0) {
        console.log("Email not registered.");
        return res.status(200).json({ success: false, message: "Register your email before attempting to verify." });
      }

      // check that the account has not already been verified
      if (emailResult[0].isVerified) {
        console.log("Already Verified.")
        return res.status(200).json({ success: false, message: "This account has already been verified." })
      }

      // check that the verification code is correct
      if (verificationCode === emailResult[0].verification_token) {
        await queryAsync('UPDATE users SET isVerified = 1 WHERE email = ?', [email]);
        return res.status(200).json({ success: true, message: "Your account has been successfully verified!" });
      }
      else {
        console.log("Incorrect Verification code entered.");
        return res.status(200).json({ success: false, message: "Incorrect verification code for the email provided." });
      }
    } catch (error) {
      console.error("Error during verification:", error);
      return res.status(500).json({ success: false, message: "Internal server error during verification." });
    }
  });

  // Utility function to promisify the MySQL queries
  function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
  }

  return router;
};