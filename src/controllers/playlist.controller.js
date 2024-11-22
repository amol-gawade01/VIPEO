import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!(name || description)) {
        throw new ApiError(401,"Playlist name and description require")
    }

    const findPlaylist = await Playlist.aggregate(
        [
            {
                $match:{
                    name
                }
            }
        ]
    )

    if (findPlaylist) {
        return res.status(202)
        .json(

            new ApiResponse(202,{},"Playlist Name Already taken ")
        )
    }





    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })

    if (!createdPlaylist) {
        throw new ApiError(500,"Error while creating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdPlaylist,
            "Playlist created successfully"
        )
    )

    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const usersPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
           $lookup:{
            from:"videos",
            localField:"videos",
            foreignField:"_id",
            as:"videos",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner"
                    }
                },{
                    
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    
                },{
                    
                    $project:{
                        title:1,
                        thumbnail:1,
                        description:1,
                        owner:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                }
            
            ]

           }
           
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"createdBy",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            fullName:1,
                            username:1,
                        }
                    }
                ]

            }
        },{
            $addFields:{
                createdBy:{
                    $first:"$createdBy"
                }
            }
        },{
            $project:{
                videos:1,
                createdBy:1,
                name:1,
                description:1
            }
        }
    ])

    if (!usersPlaylist) {
        throw new ApiError(500,"Error while creating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            usersPlaylist,
            "User playilist fetch successfully"
        )
    )

   
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlistGet = await Playlist.findById(playlistId)

    if (!playlistGet) {
        throw new ApiError(500,"Error while fetching olaylist")
    }
       
     return res.status(200)
     .json(
        new ApiResponse(200,playlistGet,"playlist fetch successfully")
     )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!(mongoose.Types.ObjectId.isValid(playlistId) || mongoose.Types.ObjectId.isValid(videoId))) {
        throw new ApiError(400,"Invalid PlaylistId or videoId ")
    }

    const addedVideoToPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:videoId
            }
        },{
            new:true
        }
    )

   

   if (!addedVideoToPlayList) {
    throw new ApiError(500,"Internal error while adding video to playlist")
   }


   return res.status(200)
   .json(
    new ApiResponse(200,addedVideoToPlayList,"video added to playlist successfully"
    )
   )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!(mongoose.Types.ObjectId.isValid(playlistId) || mongoose.Types.ObjectId.isValid(videoId))) {
        throw new ApiError(400,"Invalid PlaylistId or videoId ")
    }

    const removedVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{videos:videoId}
        },{
            new:true
        } 
    )


    if (!removedVideo) {
        throw new ApiError(500,"Error While deleting the video from playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,removedVideo,"Video Removed from playlist")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!mongoose.Types.ObjectId(playlistId)) {
        throw new ApiError(400,"Invalid PlaylistId")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(
        playlistId,
    )

    if (!deletedPlaylist) {
        throw new ApiError(500,"Error While removing playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedPlaylist,"playlist deleted successfully")
    )
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!(name || description)) {
        throw new ApiError(401,"Name and description is invalid or empty")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },{
            new:true
        }
    )


    if (!updatedPlaylist) {
        throw new ApiError(500,"error while updating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}