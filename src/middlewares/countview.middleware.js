import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const countView = asyncHandler(async(req,res,next) => {

    const {videoId} = req.params;
    const increaseView = await Video.findByIdAndUpdate(
     videoId,
     {
        $inc:{
         views:1
        }
     },
     {
         new:true
     }
    )
 
    if (!increaseView) {
     throw new ApiError(500,"Error while adding view")
    }
 
    next();

}) 

