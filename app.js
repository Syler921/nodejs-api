const path = require("path");

const { clearImage } = require('./util/file')
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const multer = require("multer");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const { graphqlHTTP } = require("express-graphql");

const auth = require("./middleware/auth");

const { URLSearchParams } = require("url");
global.URLSearchParams = URLSearchParams;

const { v4: uuidv4 } = require("uuid");

const app = express();

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    console.log("id ???", uuidv4());
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//app.use(bodyParser.urlencoded())
app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET,POST,PUT,PATCH,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not Authenticated");
  }
  console.log(req.file)
  if (!req.file) {
    return res.status(200).json({ message: "No file provided ! " });
  }
  console.log(req.body)
  if (req.body.oldPath) {
    console.log(req.body.oldPath)
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ 
      message: "File stored", 
      filePath: req.file.path 
    });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occured.";
      const code = err.originalError.code || 500;

      return { message: message, status: code, data: data };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

const MONGODB_URI =
  "mongodb+srv://syler:159753258@cluster0.okpks.mongodb.net/messages";
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const server = app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });


