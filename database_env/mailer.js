var _ = require('lodash');
var nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
   service: "Gmail",  // sets automatically host, port and connection security settings
   auth: {
       user: "hrteamchatbot@gmail.com",
       pass: "Chatbot#2018"
   }
});

var generateHTML = function (user) {
  var firstName = _.get(user, 'firstName');
  var sortCode = _.get(user, 'sortCode');
  var obfuscatedSortCode = '**-**-' + sortCode[sortCode.length-2] + sortCode[sortCode.length-1];
  var accountNumber = _.get(user, 'accountNumber');
  var obfuscatedAccountNumber = '******' + accountNumber[accountNumber.length-2] + accountNumber[accountNumber.length-1];
  var html = `<p>Dear ${firstName},</p><p>Following your recent enquiry to our Chatbot, your bank details have been updated with the following:</p>Sort code: ${obfuscatedSortCode}<br>Account Number: ${obfuscatedAccountNumber}<p>If you did not request those changes, please contact the HR Team as soon as possible.<p>Kind Regards,<br>The HR Team`
  // console.log(html);
  return html;
};

var sendMail = function (mailOptions) {
  // Send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
  });
};

var sendMailChangeBankDetails = function(user) {
  var html = generateHTML(user);
  var mailOptions = {
    from: 'HR Chatbot <hrteamchatbot@gmail.com>',
    to: _.get(user, 'email'),
    subject: 'Your HR Online - Bank details update',
    html: html
  };
  sendMail(mailOptions);
};

module.exports = {
  sendMailChangeBankDetails: sendMailChangeBankDetails
}
