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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User data fetched successfully:", user._id); // Log user data fetched
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
      "Username Company Role ProfileImage"
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

    const userId = req.user._id; // Get the user ID from the authenticated user
    const { Username, Email, Company, Role } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle profile image upload
    if (req.files && req.files.ProfileImage) {
      user.ProfileImage = req.files.ProfileImage[0].path;
    }
    // Handle username update
    if (Username && Username !== user.Username) {
      const existingUsername = await User.findOne({ Username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.Username = Username;
    }
    // Handle email update
    if (Email && Email !== user.Email) {
      const existingEmail = await User.findOne({ Email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.Email = Email;
    }
    // Update other fields
    if (Company) user.Company = Company;
    if (Role) user.Role = Role;
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
