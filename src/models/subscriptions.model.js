import mongoose,{Schema} from "mongoose"


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