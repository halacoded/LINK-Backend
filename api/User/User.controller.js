const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log({ error: error });
  }
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

//AUTH SECTION ****************************************************************************
exports.signup = async (req, res, next) => {
  try {
    const { Username, Email, Company, Role, password, confirmPassword } =
      req.body;
    console.log("Received data:", req.body); // Log the received data

    // Check if all required fields are provided
    if (
      !Username ||
      !Email ||
      !Company ||
      !Role ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ Username }, { Email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ message: "Error hashing password" });
    }

    // Create new user
    const user = new User({
      Username,
      Email,
      Company,
      Role,
      password: hashedPassword,
      ProfileImage: "", // Default profile image
      provider: "local",
      isThirdParty: false,
      profileComplete: true,
    });

    await user.save();
    // Generate token for the new user
    const token = generateToken(user);

    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = generateToken(req.user);
    return res.status(201).json({ token: token });
  } catch (err) {
    next(err);
  }
};

//USER SECTION ************************************************

exports.getUserByUsername = async (req, res, next) => {
  try {
    const usernameQuery = req.params.Username;

    // Case-insensitive partial match on Username (Very Helpfull for frontend Search)
    const users = await User.find({
      Username: { $regex: usernameQuery, $options: "i" },
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users match your search" });
    }

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user found in req.user" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { Username } = req.query;
    let query = {};

    if (Username) {
      query.Username = { $regex: Username, $options: "i" }; // Case-insensitive search
    }

    const users = await User.find(query).select(
      "_id Username Email Company Role ProfileImage"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res
      .status(500)
      .json({ message: "Error searching users", error: error.message });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    const userId = req.user._id;
    const { Username, Email, Company, Role } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.files && req.files.ProfileImage) {
      user.ProfileImage = req.files.ProfileImage[0].path;
    }

    if (Username && Username !== user.Username) {
      const existingUsername = await User.findOne({ Username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.Username = Username;
    }

    if (Email && Email !== user.Email) {
      const existingEmail = await User.findOne({ Email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.Email = Email;
    }

    if (Company) user.Company = Company;
    if (Role) user.Role = Role;

    if (user.Company && user.Role && user.Username && user.Email) {
      user.profileComplete = true;
    }

    await user.save();
    const updatedUser = await User.findById(userId).select("-password");

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

exports.getCompanyUsers = async (req, res) => {
  try {
    // 1. Get the current user (from auth middleware)
    const currentUser = req.user;

    // 2. Check if user has a company
    if (!currentUser.Company) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with a company",
      });
    }

    // 3. Fetch users from the same company (excluding current user)
    const companyUsers = await User.find({
      Company: currentUser.Company,
      _id: { $ne: currentUser._id }, // Optional: Exclude self
    }).select("Username Email Role"); // Only return necessary fields

    // 4. Return the list
    res.status(200).json({
      success: true,
      count: companyUsers.length,
      data: companyUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
};
