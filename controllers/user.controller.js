import User from '../models/user.model.js';

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("[Get Profile Error]", error);
        res.status(500).json({ message: "Server error while fetching profile." });
    }
};

export const updateProfile = async (req, res) => {
    const { firstName, lastName, email } = req.body;
    
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;

        const updatedUser = await user.save();
        
        res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updated.lastName,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error("[Update Profile Error]", error);
        res.status(500).json({ message: "Server error while updating profile." });
    }
};
