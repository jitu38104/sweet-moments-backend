require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const url = process.env.LOCAL_DB;

//body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//static middleware
app.use(express.static('uploads/'));

//session middleware
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//cors middleware
app.use(cors());

//local variables
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

//routers
const user = require('./routers/user');
const moment = require('./routers/moment');

app.use('/user', user);
app.use('/moment', moment);

app.get('/', (req, res) => {
    res.send(`
    <div style="display: flex; justify-content: center; align-items: center; height: 80vh;">
        <h2>Welcome to our server page!</h2>
    </div>
    `);
})

mongoose.connect(url, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false 
}).then((res) =>{
    console.log(`<${res.connections[0].name}> database has been connected.`);
    app.listen(PORT, () => console.log("Server is running on port:", PORT));
}).catch(err => {
    console.log(err.message);   //error
});
