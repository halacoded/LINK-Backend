const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, Username: user.Username },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

exports.handleGoogleCallback = async (req, res) => {
  console.log("✅ Authenticated user from Google:", req.user);
  const token = generateToken(req.user);
  if (!req.user.Company || !req.user.Role) {
    return res.redirect(
      `http://localhost:3000/complete-profile?token=${token}`
    );
  }
  res.redirect(`http://localhost:3000/profile?token=${token}`);
};

exports.handleGitHubCallback = async (req, res) => {
  console.log("✅ Authenticated user from Githup:", req.user);
  const token = generateToken(req.user);
  if (!req.user.Company || !req.user.Role) {
    return res.redirect(
      `http://localhost:3000/complete-profile?token=${token}`
    );
  }

  res.redirect(`http://localhost:3000/profile?token=${token}`);
};
