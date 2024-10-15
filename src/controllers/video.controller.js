import mongoose, {isValidObjectId, Schema} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const queryWords = query.split(' ').filter(word => word.trim().length > 0);
    console.log("Query Words:", queryWords);

    // Build the $or conditions for each word
    const searchConditions = queryWords.map(word => ({
        title: { $regex: word, $options: 'i' } // Case-insensitive match for each word
    }));

    // Prepare the aggregation pipeline
    const getvideos = await Video.aggregate([
        // Apply $match if there are query words
        ...(searchConditions.length > 0 ? [{ $match: { $or: searchConditions } }] : []),
        
        // Optionally match by userId if provided
        ...(userId ? [{ $match: { owner: new mongoose.Types.ObjectId(userId) } }] : []),
       
        // Sorting by the specified field and type (ascending or descending)
        {
            $sort: { [sortBy]: sortType === 'desc' ? -1 : 1 }
        },
        
        // Pagination logic
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    if (getvideos.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "There are no videos for this query"
            )
        )
    }

    console.log(getvideos)

    // Return the videos as a response
    return res.status(200)
    .json(
         new ApiResponse(
            200,
           { currentPage: parseInt(page),
            totalResults: getvideos.length,
            getvideos},
            "videos fetch successfully"

         )
        
    )
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user._id;
    

    if (!(title || description)) {
        throw new ApiError(400,"Title and Description of video required")
    }

    const videoPath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;

   if (!(videoPath || thumbnailPath)) {
        throw new ApiError(401,"Video and Thumbnail require")
    }
    
    const videoFile = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)
   

    

    const video = await Video.create({
        title,
        description,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        owner:userId.toString()
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video Publish Successfully "
        )
    )



})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params 
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(
            400,
            "Invalid Video Id "
        )
    }

    const getVideo = await Video.findById(videoId);
    if(!getVideo.isPublished) return res.status(200)
        .json(new ApiResponse(200,{},"video is unpublished"))

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            getVideo,
            "video fetch successfully"
        )
    )
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const updatedValues = req.body;
    const getVideoAndUpdate = await Video.findById(videoId);
    if (!getVideoAndUpdate) {
        throw new ApiError(400,"video not found")
    }

    Object.assign(getVideoAndUpdate,updatedValues)
    await getVideoAndUpdate.save()

    return res.status(200)
    .json(
        new ApiResponse(200,
            {},
            "video update successfully"
        )
    )


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const getVideo = await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"video update successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    // Use an aggregation pipeline with $set and $cond to toggle isPublished
    const updatedVideo = await Video.findOneAndUpdate(
        { _id: videoId },
        [
            {
                $set: {
                    isPublished: { $cond: { if: "$isPublished", then: false, else: true } }
                }
            }
        ],
        { new: true }
    );

    if (!updatedVideo) {
        return res.status(404).json({ message: 'Video not found' });
    }

    // Respond with the updated video
   return  res.status(200).json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video Publish Status Change"
        )
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}