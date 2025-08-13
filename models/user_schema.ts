import mongoose from 'mongoose'
export const userschema = new mongoose.Schema({
    username:{
        type: String,
        required :true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['admin','client'],
        required: true
    }
},{timestamps:true})

export const User = mongoose.models.User || mongoose.model("User",userschema)