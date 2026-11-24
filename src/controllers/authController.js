const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const generateToken = (userId) => {
  const secret =
    process.env.JWT_SECRET ||
    "super_secret_jwt_key_dynamic_form_builder_4y_exp_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, department, designation, role } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest("Please provide name, email, and password");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists");
    }

    // Role-based assignment
    const assignedRole = role ? String(role).toLowerCase().trim() : "user";

    const user = await User.create({
      name,
      email,
      password,
      department: department || "General",
      designation: designation || "Staff",
      role: assignedRole,
    });

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
    };

    res
      .status(201)
      .json(
        ApiResponse.created(
          { user: userData, token },
          "User registered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("Please provide both email and password");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // 🔒 ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT:
    // Only users with the 'Admin' role are permitted to log in to the system.
    const userRole = (user.role || "").toLowerCase();
    if (userRole !== "admin") {
      throw ApiError.forbidden(
        `Access Denied: Only users with the 'Admin' role are permitted to log in. Your registered account role is '${user.role}'.`,
      );
    }

    // If role was explicitly specified in login request, verify it matches
    if (role && String(role).toLowerCase().trim() !== "admin") {
      throw ApiError.forbidden(
        `Access Denied: Login role '${role}' is not authorized. Only 'Admin' can access this application.`,
      );
    }

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
    };

    res
      .status(200)
      .json(
        ApiResponse.success(
          { user: userData, token },
          "Logged in successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    res
      .status(200)
      .json(ApiResponse.success(user, "Current user profile fetched"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
