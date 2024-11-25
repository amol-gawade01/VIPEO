import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query 

    const getComments =  await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"owner",
                as:"createdBy",
                pipeline:[
                    {
                        $project:{
                            avatar:1,username:1,fullName:1
                        }
                    },
                ]
            }
        },{
            $addFields:{
                createdBy:{
                    $first:"$createdBy"
                }
            }
        },{
            $unwind:"$createdBy"
        },{
            $project:{
                content:1,
                createdBy:1
            }
        },{
            $skip:(page-1)*limit
        },{
            $limit:parseInt(limit)
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            getComments,
            "All comments fetch successfully"
        )
    )


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body;
    const {videoId} = req.params;

    if (!content) {
        throw new ApiError(401,"content is empty")
    }

    if (!isValidObjectId(videoId)) {
     throw new  ApiError(401,"Invalid video id ")  
    }

    const commentAdded = await Comment.create(
        {
            content,
            video:videoId,
            owner:req.user?._id
        }
    )

    if (!commentAdded) {
        throw new ApiError(500,"Error while creating comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            commentAdded,
            "comment add successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params;
    const {content} = req.body;


    if (!isValidObjectId(commentId)) {
        throw new ApiError(401,"Invalid comment id")
    }
    
    const comment = await Comment.findById(commentId)

    if (!((comment.owner).equals(req.user?._id))) {
        throw new ApiError(400,"Unautorized do that action")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },{
            new : true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"comment updated successfully")
    )


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(401,"Invalid comment id")
    }


    const comment = await findById(commentId)

    if (!((comment.owner).equals(req.user?._id))) {
        throw new ApiError(400,"Unautorized do that action")
    }


    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new ApiError(500,"Error while deleting the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
        deletedComment,
        "Comment deleted successfully "
        )
    )
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }