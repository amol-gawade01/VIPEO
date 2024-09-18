import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser}