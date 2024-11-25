import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid VideoId")
    }

    const checkIfLiked = await Like.findOne(
        {$and:[{video:videoId},{likedBy:req.user?._id}]}
    )

    if (!checkIfLiked) {
      const liked =  await Like.create(
            {
                video:videoId,
                likedBy:req.user?._id
            }
        )

        if (!liked) {
            throw new ApiError(500,"Error while like by user")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                liked,
                "video liked successfully"
            )
        )
    }
     
    const unliked = await Like.findByIdAndDelete(checkIfLiked._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,unliked,"video unlike successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(401,"Invalid commentId")
    }

    const checkIfLiked = await Like.findOne(
        {$and:[{comment:commentId},{likedBy:req.user?._id}]}
    )

    if (!checkIfLiked) {
      const liked =  await Like.create(
            {
                comment:comment,
                likedBy:req.user?._id
            }
        )

        if (!liked) {
            throw new ApiError(500,"Error while like by user")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                liked,
                "comment liked successfully"
            )
        )
    }
     
    const unliked = await Like.findByIdAndDelete(checkIfLiked._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,unliked,"comment unlike successfully")
    )

    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

     
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(401,"Invalid commentId")
    }
    
    const checkIfLiked = await Like.findOne(
        {$and:[{tweet:tweetId},{likedBy:req.user?._id}]}
    )

    if (!checkIfLiked) {
      const liked =  await Like.create(
            {
                tweet:tweetId,
                likedBy:req.user?._id
            }
        )

        if (!liked) {
            throw new ApiError(500,"Error while like by user")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                liked,
                "tweet liked successfully"
            )
        )
    }
     
    const unliked = await Like.findByIdAndDelete(checkIfLiked._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,unliked,"tweet unlike successfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVids = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup:{
                from:"videos",
                foreignField:"_id",
                localField:"video",
                as:"video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        avatar:1,
                                        username:1,
                                        fullName:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    },
                    {
                            $project:{
                                videoFile:1,
                                thumbnail:1,
                                title:1,
                                duration:1,
                                views:1,
                                owner:1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $project:{
                video:1,
                likedBy:1
            }
        }
   
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVids,"Liked videos fetch successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}