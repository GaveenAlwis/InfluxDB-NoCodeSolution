import createError from "http-errors";
import express, {json, urlencoded} from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";


const port = process.env.SERVER_PORT || 8000;

// Import routers
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";

const app = express();

app.use(cors({
  origin: ["http://client:80"],
  credentials: true,
}));
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({extended: false}));
app.use(cookieParser());


// Connect routers
app.use("/api", indexRouter);
app.use("/api/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.send({message: res.locals.message});
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
