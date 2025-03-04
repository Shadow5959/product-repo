const express = require('express')
const bodyParser = require('body-parser')
const path = require('path');
const app = express();
const dotenv = require('dotenv');
dotenv.config()
const staticRoute = require('./routes/pages.js');
const imageDirectory = path.join(__dirname, 'public/images');
const cookieParser = require('cookie-parser');



app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use("/", staticRoute);
app.use('/images', express.static(imageDirectory));
app.use(cookieParser());

module.exports = app;