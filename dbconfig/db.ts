import mongoose from 'mongoose'

export const connectdb = async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL!)
        // await mongoose.connect('mongodb+srv://karamveersinghsuri:karam123@cluster0.ffrocit.mongodb.net/bills')
        const connection = mongoose.connection
        connection.on('connected', ()=>{
            console.log('MongoDB connected successfully')
        })
        connection.on('error', (err) => {
            console.log(err,'MongoDB connection error. Please make sure MongoDB is running. ' + err);
            process.exit();
        })
        } catch (error: any) {
            return console.log(error.message,"problem in connecting the db");
    }
}