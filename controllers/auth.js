const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

//const fs = require("fs");
//const path = require("path");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed. ");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try {
    const hashedPw = await bcrypt.hash(password, 12);

    const user = new User({
      email: email,
      password: hashedPw,
      name: name,
    });
    const result = await user.save();

    res.status(201).json({ message: "User created ! ", userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error("User with this email cannot be found . ");
      error.statusCode = 401;
      error.data = errors.array();
      throw error;
    }
    loadedUser = user;

    const isEqual = await bcrypt.compare(password, user.password);

    console.warn("isEqual---", isEqual);
    if (!isEqual) {
      const error = new Error("Wrong password !");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    return
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
   
    next(err);
    return err;
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    console.log('userid ???????????????----',req.userId)
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }
    console.log(111)
    res.status(200).json({ status: user.status });
    console.log('2222---', user.status)

  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }
    user.status = newStatus;
    await user.save();

    res.status(200).json({ message: "User updated" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
