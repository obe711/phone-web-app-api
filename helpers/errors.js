exports.unAuthorize = function (res, message) {
  res.clearCookie("sid", {
    httpOnly: true,
  });
  return res.status(401).send(message);
};
