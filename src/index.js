import dotenv from "dotenv"
import connectToDB from "./db/db.js"
import { app } from "./app.js"

dotenv.config({
    path:'./env'
})

connectToDB()
.then(()=>{
   // Error While connectting to server
   app.on('error',(error) =>{
    throw error;
    
   })

   //Connect to server
   app.listen(process.env.PORT,()=>{
    console.log(`Server is running at port : ${process.env.PORT}`);
   })
})
.catch((err)=>{
    console.log("Connection To DB Failed !!!",err);
    
})