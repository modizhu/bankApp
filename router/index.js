const router = require('express').Router();
const users = require('../model/allUser');
const customers = require('../model/allUser');
const historyModel = require('../model/histoyModel');
const session = require('express-session');

router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60000 }  // secure should be true if using https, maxAge sets cookie expiration
}));

router.get('/', (req,res)=> {
    res.render('home', { msg:'Welcome!', isLoggedIn: req.session.isLoggedIn, username: req.session.username})
});

//  ADD USER
router.get('/register', (req, res) => {
    res.render('register', {title: "Register", msg:'', isLoggedIn: req.session.isLoggedIn || false})
});

router.post('/register',(req, res) =>{
    const {userName, userEmail, userPassword, userNumber, userAmount} = req.body;
    const User = new customers({
        name: userName,
        email: userEmail,
        password: userPassword,
        contact: userNumber,
        amount: userAmount,
    });
    User.save().then(()=>{
        res.render('login', {title: "Register", msg:'User Registered Successfully', isLoggedIn: req.session.isLoggedIn || false, username: req.session.username || null })
    }).catch((err)=>{
        console.log(err)
    })
})

//- View All User
router.get('/data',(req,res) => {
    const allData = customers.find({});
    allData.exec((err, data) => {
        if(err){
            throw err;
        }
        else{
            res.render('viewUser',{title: "View Users", data:data, isLoggedIn: req.session.isLoggedIn || false, username: req.session.username || null });
        }
    })
})

// This is login
router.get('/login', (req, res) => {
    res.render('login', {title: "Login", msg:'Please sign in', isLoggedIn: req.session.isLoggedIn ||false, username: req.session.username || null })
});
router.post('/login', (req, res) => {
    const { userEmail, userPassword } = req.body;

    customers.findOne({ email: userEmail}, (err, user) => {
        if (err) {
            console.error("Error accessing the database:", err);
            return res.render('login', {title: "Login", msg: 'Error accessing the database!', isLoggedIn: req.session.isLoggedIn ||false, username: req.session.username || null});
        }
        if (!user) {
            return res.render('login', {title: "Login", msg: 'User not found!', isLoggedIn: req.session.isLoggedIn ||false, username: req.session.username || null});
        }
        // Assuming you are storing plain text passwords (not recommended)
        // In production, you should be storing hashed passwords and comparing the hash.
        if (user.password === userPassword) {
            // If user authentication is successful:
            req.session.isLoggedIn = true;
            req.session.username = user.name;
            req.session.userEmail = userEmail; // Save user email to session for further reference
            return res.redirect('/');
        } else {
            return res.render('login', {title: "Login", msg: 'Incorrect password!', isLoggedIn: req.session.isLoggedIn ||false, username: req.session.username || null });
        }
    });
});

// This is for sign out
router.get('/signout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Handle error
            console.error("Error during sign out:", err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Delete User
router.get('/delete/:id',(req,res)=> {
 const id = req.params.id;
 const updateData = customers.findByIdAndDelete({"_id":id});
 updateData.exec((err,data) => {
     if(err){throw err}
     else{
         res.redirect('/data')
     }
 })
});

// Balance (Deposite and WithDraw)
router.get('/balance', (req, res) => {
    res.render('balance', {title: "Balance", msg:'', isLoggedIn: req.session.isLoggedIn || false, username: req.session.username || null })
});

router.post('/balance', async (req, res) => {
    const amountChange = Number(req.body.amountChange);
    const username = req.session.username;
    
    await customers.findOneAndUpdate(
        { "name": username },
        { $inc: { "amount": amountChange } }
    );

    res.redirect('/data');
});


router.get('/remove/:id',(req,res)=> {
    const id = req.params.id;
    const updateData = historyModel.findByIdAndDelete({"_id":id});
    updateData.exec((err,data) => {
        if(err){throw err}
        else{
            res.redirect('/history')
        }
    })
});


module.exports = router;