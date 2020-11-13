exports.verifyEmail = async function (emailAddress, userId, regToken) {
  try {
    console.log(emailAddress, userId, regToken);
    return "ok";
  } catch (ex) {
    console.log(ex);
    return "Email Error";
  }
};
