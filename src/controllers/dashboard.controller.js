import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = new mongoose.Types.ObjectId(req.user?._id)
    const getVidsStats = await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $group: {
                _id: "$views",
                totalViews: {
                    $sum: "$views",
                },
                totalVideos: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: 1,
                totalVideos:1
            }
        }
    ])
    
    console.log(getVidsStats)
   
    const getSubStats = await Subscription.aggregate([
        {
            $match:{
                Channel:userId
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 } // Count the number of subscribers
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscribers: 1
            }
        }
    ])

    console.log(getSubStats)
    

    const getLikesStats = await Like.aggregate([
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoInfo"
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"tweet",
                foreignField:"_id",
                as:"tweetInfo"
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"comment",
                foreignField:"_id",
                as:"commentInfo"
            }
        },
        {
            $match:{
                $or:[
                    {"videoInfo.owner":userId},
                    {"tweetInfo.owner":userId},
                    {"commentInfo.owner":userId}
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                totalLikes: 1
            }
        }
        
    ])

    console.log(getLikesStats)


    const info = {
        views:getVidsStats[0].totalViews,
        videos:getVidsStats[0].totalVideos,
        totalSubs:getSubStats[0].totalSubscribers,
        totalLike:getLikesStats[0].totalLikes
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            info,
            "Fetched viwes"
        )
    )

   


})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                duration:1,
                views:1,
                isPublished:1,
                owner:1,
                createdAt:1,
                updatedAt:1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Fetched videos"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }