import mongoose,{Schema} from "mongoose"

//How to count subscribers of a channel?
//-> 1) Take the channel name and search in schema through channel  
//   2) In return we get many documents through channel count them 

// How to know which channel a user subscribe ?
//=>  1)we take user id and search in schema through subscriber 
//    2)In return document we check the channel name and give the list 

const SubscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, // One Who is subscribing
        ref:"User"
        },
    Channel:{
      type:Schema.Types.ObjectId, //one to whom subscriber is subscribing
      ref:"User"
    }
},{
    timestamps:true
})

export const Subscription = mongoose.model("Subscription",SubscriptionSchema)