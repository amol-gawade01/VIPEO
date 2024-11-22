import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({  // express.json() is middleware which accepts json data and parsed it and puts the data in req.bdy
    limit:"16kb"
}))

app.use(express.urlencoded());  
app.use(express.static("public"));
app.use(cookieParser());



// import router 
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js"



//router declaration

app.use("/api/v1/users",userRouter);
app.use("/api/v1/video",videoRouter);
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)

export {app};