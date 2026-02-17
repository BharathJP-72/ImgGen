import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './mongodb/connect.js'
import postRoutes from './routes/postRoutes.js'
import dalleRoutes from './routes/dalleRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({limit: '50mb'}))

app.use('/api/v1/post', postRoutes)
app.use('/api/v1/dalle', dalleRoutes)

app.get('/', async (req,res) => {
    res.send('Hello from Backend')
})

const startServer = async () => {

    try {
        connectDB(process.env.MONGODB_URL)
        app.listen(8080, () => console.log('Server has started on http://localhost:8080'))
    } catch (error) {
        console.log(error);
        
    }

    
}
// mongodb+srv://laughtale72:Mongodb%404321@cluster0.idrmzsu.mongodb.net/?appName=Cluster0
startServer()