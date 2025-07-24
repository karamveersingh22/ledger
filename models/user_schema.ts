import mongoose from 'mongoose'
export const userschema = new mongoose.Schema({
    phone:{
        type: String,
        required :true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
},{timestamps:true})

export const User = mongoose.models.User || mongoose.model("User",userschema)