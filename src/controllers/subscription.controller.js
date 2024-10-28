import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params  

    const user = req.user;
    if (!user) {
        throw new ApiError(401,"Unauthorized Request")
    }

   const existUser = await Subscription.findOne({
    subscriber:new mongoose.Types.ObjectId(user._id),
    Channel:new mongoose.Types.ObjectId(channelId)

})


if(!existUser){
   const resSub =  await Subscription.create({
        subscriber:user._id,
        Channel:new mongoose.Types.ObjectId(channelId)
    })

    return res
    .status(200)
    .json(
       new ApiResponse(
        200,
        resSub,
        "Subscribed Successfully"
       )
    )
}else{

    const resUnSub =  await Subscription.deleteOne({
        subscriber:user._id,
        Channel:new mongoose.Types.ObjectId(channelId)
    })

    return res
    .status(200)
    .json(
       new ApiResponse(
        200,
        resUnSub,
        "UnSubscribed Successfully"
       )
    )

}



   
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subsList = await Subscription.aggregate([
      

        {
            $match: {
              Channel: new mongoose.Types.ObjectId(channelId)
            }
          },
          {
            $lookup: {
              from: "users", // Correct collection name
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriber",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $unwind: "$subscriber"
          },{
            $project:{
                subscriber:1
            }
          }
        ]);

  if(!subsList){
        throw new ApiError(500,"Error while fetching subscribers")
    }
    

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            subsList.length === 0? []:subsList,
            "Subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channelList = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },{
            $lookup:{
                from:"users",
                localField:"Channel",
                foreignField:"_id",
                as:"subscribedTo",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $unwind:"$subscribedTo"
        },{
            $project:{
                subscribedTo:1,
                _id:0
            }
        }
    ])

    if (!channelList) {
        throw new ApiError(500,"Error while fetching subscribed channels")
    }
    

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            channelList === 0 ? []:channelList,
            "Subscribed channels fetch successfull"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}