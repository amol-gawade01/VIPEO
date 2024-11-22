import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateRefreshAndAccessToken = async(userId) => {
    try {
      
      const user = await User.findById(userId)
      const refreshToken  = user.generateRefreshToken()
      const accessToken  = user.generateAccessToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {refreshToken,accessToken}


    } catch (error) {
      throw new ApiError(500,"something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler(async(req,res) => {
  // get user Details 
  // Validation - not empty
  //check if already exist : username & email 
  //Check for images . check for avatar
  //upload them to cloudinary
  //create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation 
  // return response

  const {username,email,fullName,password} = req.body

  if (
    [username,email,fullName,password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400,"All fields are required")
  }
   
  const existedUser = await User.findOne({
    $or:[{email},{username}]
  })

  if (existedUser) {
    throw new ApiError(409,"User with email or username already exist")
  }
   
  const avatarlocalpath = req.files?.avatar[0]?.path;



   let coverImagelocalpath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImagelocalpath = req.files.coverImage[0].path;
    
   }

  if (!avatarlocalpath) {
    throw new ApiError(400,"Avatar File required")
  }
   
  

  const avatar = await uploadOnCloudinary(avatarlocalpath)
  const coverImage = await uploadOnCloudinary(coverImagelocalpath)

  if(!avatar){
    throw new ApiError(400,"Avatar File required")
  }

 const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500,"User not created while registering ")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User created Successfully")
  )

})

const loginUser = asyncHandler(async (req,res) => {
    //Take Data from reqBody
    //Check user by username or email
    //find the user
    //If the user get check the the password 
    //send accesss and refresh token by cookies 

    const {email,username,password} = req.body;

    if(!(username || email)){
      throw new ApiError(400,"username or email is not found")
    }

  const user =   await User.findOne({
      $or:[{username},{email}]
    })

    if(!user){
      throw new ApiError(404,"User Does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
      throw new ApiError(401,"Passwoord is Invalid")
    }

    const {refreshToken,accessToken } = await generateRefreshAndAccessToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    const options = {
      httpOnly:true,
      secure:true
    }
    

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "user logged in successfully"
      )
)
     



})


const logoutUser = asyncHandler(async (req,res)  => {
  await User.findByIdAndDelete(req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
   },{
    new:true
  }
  )

  const options = {
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async (req,res) =>{
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorized Request")
  }
  
  try {
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   console.log(decodedToken)
  
   const user = await User.findById(decodedToken._id)
   if(!user){
    throw new ApiError(401,"Invalid refresh token")
   }
  
   if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401,"Invalid refreh token or used")
   }
  
   const options = {
    httpOnly:true,
    secure:true
   }
  
    const {newrefreshToken,accessToken} = await generateRefreshAndAccessToken(user._id)
  
   res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newrefreshToken,options)
   .json(
    new ApiResponse(
      200,
      {accessToken,refreshToken:newrefreshToken},
      "Acccess token refreshed"
    )
   )
  } catch (error) {
    throw new ApiError(401,error?.message ||
      "Refresh Token is invalid"
    )
  }



})

const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword,newPassword} = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Password change successfully"

    )
  )
  

})

const currentUser = asyncHandler(async (req,res) =>{
  return res
  .status(200)
  .json(
    200,
    req.user,
    "current user fetched"
  )
})

const updateUserDetails = asyncHandler(async(req,res) => {
  const {fullName,email} = req.body
  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }
  const user = await User.findByIdAndUpdate(req.user?._id
    ,
    {
       $set:{fullName,email}
    },{new:true}
  ).select("-password")
  
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "User Update successfully"
    )
  )
})

const updateUserAvatar = asyncHandler(async (req,res) => {
const avatarLocalpath = req.file?.path
  if (!avatarLocalpath) {

    throw new ApiError(400,"Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalpath)
  if (!avatar.url) {
    throw new ApiError(400,"Error while uploading avatar" )
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {  
      $set:{avatar:avatar.url}  
    },
    {new:true}

  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Avatar Update Successfully")
  )
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
  const CoverImageLocalpath = req.file?.path
  if (!CoverImageLocalpath) {

    throw new ApiError(400,"Avatar file is missing")
  }
  const coverImage = await uploadOnCloudinary(CoverImageLocalpath)
  if (!coverImage.url) {
    throw new ApiError(400,"Error while uploading CoverImage" )
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {  
      $set:{coverImage:coverImage.url}  
    },
    {new:true}

  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"CoverImage Update Successfully")
  )
})
 
const getUserChannelInfo = asyncHandler(async (req,res) => {
  const username = req?.params
  if (!username) {
    throw new ApiError(400,"user does not exist")
  }
   
  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      },
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      },
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      },
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribesCount:{
          $size:"$subscribedTo"
        },
      isSubscribed:{
        $cond:{
          if: {$in: [req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        }
        }
      },
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribesCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1
      }
    }
  ])

  return res
  .status(200)
  .json(
    200,
    channel[0],
    "User fetch successfully"
  )

} )

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },                                
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  // Handle response
  res.status(200).json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetch successfully"
    )
  );
});



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  currentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelInfo,
  getUserWatchHistory
}