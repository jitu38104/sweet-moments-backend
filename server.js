require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const passportInit = require("./config/passport");
const databaseConnectivity = require('./config/dbConnection');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
//const url = process.env.LOCAL_DB;
const url = process.env.CLOUD_DB;

//body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//static middleware
app.use('/uploads', express.static('uploads'));

//cors middleware
app.use(cors());

//passport middleware
passportInit();

app.use(passport.initialize());
app.use(passport.session());

//routers
const user = require('./routers/user');
const moment = require('./routers/moment');

app.use('/api/user', user);
app.use('/api/moment', moment);

app.get('/', (req, res) => {
    res.send(`
    <div style="display: flex; justify-content: center; align-items: center; height: 80vh;">
        <h2>Welcome to our server page!</h2>
    </div>
    `);
});

//errorHandler register always in the last
app.use(errorHandler);

databaseConnectivity(url).then((res) => {
    console.log(`<${res.connections[0].name}> database has been connected.`);
    app.listen(PORT, () => console.log("Server is running on port:", PORT));
}).catch(err => {
    console.log(err.message);   
});