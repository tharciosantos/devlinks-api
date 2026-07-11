import bcrypt from 'bcrypt';
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: {
        type: String,
        default: ""
    },
    profession: {
        type: String,
        default: ""
    },
    links: [{
        titulo: { type: String, required: true },
        url: { type: String, required: true }
    }],
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);

});

export const User = mongoose.model("User", userSchema);