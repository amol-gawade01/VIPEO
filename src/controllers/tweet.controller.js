import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const tweetOwner = req?.user._id
    console.log(req?.user._id.toString())
    const {content} = req?.body;
    console.log(content)
    if (!tweetOwner) {
        throw new ApiError(400,"Unauthorized User ! Log in")
    }
     
    if (!content) {
        throw new ApiError(401,"Tweet Content Should Not Empty")
    }

    const createTweet = await Tweet.create(
        {
            owner:tweetOwner.toString(),
            content
        }
    )

    if(!createTweet){
        throw new ApiError(500,"Error while creating tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createTweet,
            "Tweet created successfully "
        )
    )



    
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
   const getTweets =  await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }          
        }
    ])

    console.log(getTweets)
   if (!getTweets) {
    throw new ApiError(401,"Tweet for the search user not found")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,getTweets,"Tweets fetch successfully")
   )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
      const {tweetId} = req?.params;
      const {content} = req?.body;

      if (!content) {
        throw new ApiError(401,"Content should not empty")
      }

      const updatedTweet = await Tweet.findByIdAndUpdate(
       tweetId,{
         $set:{
            content
         }
       },{
        new:true
       }
      )

      return res.status(200)
      .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet Update Successfully"
        )
      )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req?.params;
    const deletedTweet =  await Tweet.findByIdAndDelete(
        tweetId
    )

    if (deletedTweet === null) {
        throw new ApiError(401,"The document is not found")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            deletedTweet,
            "Tweet delete successfully"
        )
    )

    

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}