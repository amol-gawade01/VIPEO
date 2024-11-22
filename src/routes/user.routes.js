import { Router } from "express";
import { currentUser, getUserChannelInfo, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserCoverImage,changeCurrentPassword,updateUserDetails,updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,currentUser);
router.route("/update-user").patch(verifyJWT,updateUserDetails);
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT,getUserChannelInfo);
router.route("/watch-history").get(verifyJWT,getUserWatchHistory);
export default router;
