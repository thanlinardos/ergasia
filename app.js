//PACKAGES
const { ObjectId } = require("bson");
var express=require("express"),
    mongodb=require("mongodb"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    LocalStrategy=require("passport-local"),
    passportLocalMongoose=require("passport-local-mongoose"),
    methodOverride = require('method-override'),
    fileUpload = require('express-fileupload'),
    fs = require('fs');
const { findById, collection } = require("./models/SitisiModel");
const binary = mongodb.Binary;
//MODELS
var Sitisi = require("./models/SitisiModel"),
    Stegasi = require("./models/StegasiModel"),
    User=require("./models/UserModel"),
    StegasiCheck=require("./models/StegasiCheckModel"),
    SitisiCheck = require("./models/SitisiCheckModel");
//DATABASE CONNECT
//uses connection string to connect to the mongodb atlas database
var packjson = require("./package.json")
var URI = packjson.URI
mongoose.connect(URI,
{
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useFindAndModify:false
});
var db=mongoose.connection;
db.on("error",console.error.bind(console,"MongoDB connection error: "));
const port=3000;


//SETUP
var app=express();

app.use("/public",express.static("public"));
app.use(express.urlencoded({extended:true}));
app.use(require("express-session")({
    secret:"this is secret",
    resave:false,
    saveUninitialized:false
}));
app.use(fileUpload());
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
//setup passport strategies to use the users collection for authenticating
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//default αρχεία στο render τα .ejs
app.set("view engine","ejs");
//INITIALISE ADMINS
User.register(new User({"username":"thanos","name":"Θανασης","surname":"Λιναρδος","startyear":2017,"email":"up1059293@upnet.gr","am":1059293,"role":"admin"}),"admin",function(err,user){
    if(err){
        console.log("admin already in database");
    }
});

//ROUTES
app.get("/",function(req,res){
    res.render("main",{user:req.user});
});
//Login
app.get("/login",function(req,res){
    res.render("login",{redirect:""});
});
//παραμετροποίηση του login για redirect στην σελίδα προέλευσης 
app.get("/login/:redirect",function(req,res){
    res.render("login",{redirect:req.params.redirect});
});
app.get("/login/:redirect/:other",function(req,res){
    red = req.params.redirect + "/" + req.params.other;
    res.render("login",{redirect:red});
});
//εδώ δημιουργείται το session σε επιτυχημένο login
app.post("/login",passport.authenticate("local",{
    failureRedirect:"/login/"
}), function(req,res){
    if(req.user.role==="admin"){
        res.redirect("/admin");
    }
    if(req.user.role!="admin"){
        res.redirect("/");
    }
});
app.post("/login/:redirect",passport.authenticate("local",{
    failureRedirect:"/login/"
}), function(req,res){
    res.redirect("/"+req.params.redirect);
});

app.post("/login/:redirect/:other",passport.authenticate("local",{
    failureRedirect:"/login/"
}), function(req,res){
    res.redirect("/"+req.params.redirect+"/"+req.params.other);
});

app.delete('/logout',(req,res) => {
    req.logOut();
    res.redirect('/login/');
});
app.delete('/logout/:redirect',(req,res) => {
    req.logOut();
    res.redirect('/login/'+req.params.redirect);
});

//Sitisi
app.get("/sitisi",isLoggedIn,function(req,res){
    //εύρεση μίας φόρμας με βάση τον logged-in user που είναι αποθηκευμένος στο req.user
    findOneBy(Sitisi,"user_ref",req.user.id).then((form)=>{
        console.log(form);
        //αν δεν υπάρχει φόρμα για αυτόν τον χρήστη
        if(form==undefined |form==null ){
            res.render("sitisi",{user:req.user})
        }
        else if(Object.keys(form).length==0) res.render("sitisi",{user:req.user})
        //αν υπάρχει η φόρμα φορτώνει το αρχείο EditSitisi που εμφανίζει τα τρέχοντα values στα inputs 
        //και εμφανίζει το Link για προβολή της φόρμας 
        else res.render("EditSitisi",{user:req.user,form:form})
    });
      
});
app.get("/sitisi/:id",isLoggedIn,function(req,res){
    
    findOneBy(Sitisi,"_id",req.params.id).then((form)=>{
        console.log(form);
        if(form==undefined |form==null){
            res.render("sitisi",{user:req.user})
        }
        else if(Object.keys(form).length==0) res.render("sitisi",{user:req.user})
        else {
            //εύρεση του αντίστοιχου doc με την απάντηση του admin στη φόρμα
            findOneBy(SitisiCheck,"sitisi_ref",req.params.id).then((check)=>{
                if(check==undefined | check==null){
                    obj={"state":"PENDING","admin_ref":"","sitisi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_sitisi",{form:form,user:req.user,check:obj})
                }
                else if(Object.keys(check).length==0){
                    obj={"state":"PENDING","admin_ref":"","sitisi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_sitisi",{form:form,user:req.user,check:obj})
                }
                else res.render("show_sitisi",{form:form,user:req.user,check:check})
            });
        }
    })
    });



app.post("/sitisi",isLoggedIn,function(req,res){
    req.body.user_ref = req.user._id;
    //μετατροπή των πεδίων για τα addresses σε objects πχ tempadressStreet,... => tempadress{street: , ...}
    req.body = refactorAdresses(req.body);
    //files αποθηκευμένα στο req.files (express-fileupload)
    //μορφοποίηση σε object με πεδίο file που περιέχει την binary μορφή του
    console.log(req.files);
    try{
    req.body.ekkatharistiko = {name:req.files.ekkatharistiko.name,file:binary(req.files.ekkatharistiko.data),type:req.files.ekkatharistiko.mimetype}
    }catch(err){
        console.log("Warning,ekkatharistiko not submited!");
    }
    try{
    req.body.tautothta = {name:req.files.tautothta.name,file:binary(req.files.tautothta.data),type:req.files.tautothta.mimetype}
    }catch(err){
        console.log("Warning,tautotha not submited!");
    }
    try{
    req.body.pasofile = {name:req.files.pasofile.name,file:binary(req.files.pasofile.data),type:req.files.pasofile.mimetype}
    }catch(err){
        console.log("Warning,paso not submited!");
    }
    console.log(req.body);
    var sitisi_form=new Sitisi(req.body);
    

    sitisi_form.save()
    .then(()=>{
        res.redirect("/sitisi");
        console.log("Sitisi Form Applied!");
    })
    .catch(function(err){
        console.log(err)}
    );

});
app.post("/sitisiUpdate/:id",isLoggedIn,function(req,res){
    req.body.user_ref = req.user._id;
    req.body = refactorAdresses(req.body);
    //files
    console.log(req.files);
    try{
    req.body.ekkatharistiko = {name:req.files.ekkatharistiko.name,file:binary(req.files.ekkatharistiko.data),type:req.files.ekkatharistiko.mimetype}
    }catch(err){
        console.log("Warning,ekkatharistiko not submited!");
    }
    try{
    req.body.tautothta = {name:req.files.tautothta.name,file:binary(req.files.tautothta.data),type:req.files.tautothta.mimetype}
    }catch(err){
        console.log("Warning,tautotha not submited!");
    }
    try{
    req.body.pasofile = {name:req.files.pasofile.name,file:binary(req.files.pasofile.data),type:req.files.pasofile.mimetype}
    }catch(err){
        console.log("Warning,paso not submited!");
    }
    console.log(req.body);
    
    update(Sitisi,req.params.id,req.body)
    .then(()=>{
        
        res.redirect("/sitisi/"+req.params.id);
        console.log("Sitisi Form Updated!");
    })
    .catch(function(err){
        console.log(err)}
    );

});

//Stegasi
app.get("/stegasi",isLoggedIn,function(req,res){
    findOneBy(Stegasi,"user_ref",req.user.id).then((form)=>{
        console.log(form);
        if(form==undefined |form==null ){
            res.render("stegasi",{user:req.user})
        }
        else if(Object.keys(form).length==0) res.render("stegasi",{user:req.user})
        else res.render("EditStegasi",{user:req.user,form:form})
    });
      
});
app.get("/stegasi/:id",isLoggedIn,function(req,res){
    
    findOneBy(Stegasi,"_id",req.params.id).then((form)=>{
        console.log(form);
        if(form==undefined |form==null){
            res.render("stegasi",{user:req.user})
        }
        else if(Object.keys(form).length==0) res.render("stegasi",{user:req.user})
        else {
            findOneBy(StegasiCheck,"stegasi_ref",req.params.id).then((check)=>{
                if(check==undefined | check==null){
                    obj={"state":"PENDING","admin_ref":"","stegasi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_stegasi",{form:form,user:req.user,check:obj})
                }
                else if(Object.keys(check).length==0){
                    obj={"state":"PENDING","admin_ref":"","stegasi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_stegasi",{form:form,user:req.user,check:obj})
                }
                else res.render("show_stegasi",{form:form,user:req.user,check:check})
            });
        }
    })
    });



app.post("/stegasi",isLoggedIn,function(req,res){
    req.body.user_ref = req.user._id;
    req.body = refactorAdresses(req.body);
    //files
    console.log(req.files);
    try{
    req.body.ekkatharistiko = {name:req.files.ekkatharistiko.name,file:binary(req.files.ekkatharistiko.data),type:req.files.ekkatharistiko.mimetype}
    }catch(err){
        console.log("Warning,ekkatharistiko not submited!");
    }
    try{
    req.body.tautothta = {name:req.files.tautothta.name,file:binary(req.files.tautothta.data),type:req.files.tautothta.mimetype}
    }catch(err){
        console.log("Warning,tautotha not submited!");
    }
    try{
    req.body.pasofile = {name:req.files.pasofile.name,file:binary(req.files.pasofile.data),type:req.files.pasofile.mimetype}
    }catch(err){
        console.log("Warning,paso not submited!");
    }
    console.log(req.body);
    var stegasi_form=new Stegasi(req.body);

    stegasi_form.save()
    .then(()=>{
        res.redirect("/stegasi");
        console.log("Stegasi Form Applied!");
    })
    .catch(function(err){
        console.log(err)}
    );

});
app.post("/stegasiUpdate/:id",isLoggedIn,function(req,res){
    req.body.user_ref = req.user._id;
    req.body = refactorAdresses(req.body);
    //files
    console.log(req.files);
    try{
    req.body.ekkatharistiko = {name:req.files.ekkatharistiko.name,file:binary(req.files.ekkatharistiko.data),type:req.files.ekkatharistiko.mimetype}
    }catch(err){
        console.log("Warning,ekkatharistiko not submited!");
    }
    try{
    req.body.tautothta = {name:req.files.tautothta.name,file:binary(req.files.tautothta.data),type:req.files.tautothta.mimetype}
    }catch(err){
        console.log("Warning,tautotha not submited!");
    }
    try{
    req.body.pasofile = {name:req.files.pasofile.name,file:binary(req.files.pasofile.data),type:req.files.pasofile.mimetype}
    }catch(err){
        console.log("Warning,paso not submited!");
    }
    console.log(req.body);
    update(Stegasi,req.params.id,req.body)
    .then(()=>{
        
        res.redirect("/stegasi/"+req.params.id);
        console.log("Stegasi Form Updated!");
    })
    .catch(function(err){
        console.log(err)}
    );

});


//Logout
//χρηση της _DELETE από το method-override για την διαγραφή του session
app.delete('/logout',(req,res) => {
    req.logOut();
    res.redirect('/login/');
});
//Register
app.get("/register",function(req,res){
    res.render("register");
});
app.post("/register",function(req,res){
    if(req.body.role!=undefined) delete req.body.role;
    console.log(req.body);
    password = req.body.password;
    delete req.body.password;
    //δημιουργία doc στο users με κρυπτογραφημένο password
    User.register(new User(req.body),password,function(err,user){
        if(err){
            console.log(err);
            return res.render("register");
        }
            res.redirect("/login/");

    });
});


//ADMIN
app.get("/admin",isAdmin,function(req,res){
    res.render("admin",{user:req.user});

});
//βρίσκει όλες τις φόρμες ανάλογα με το state τους
app.get("/sitisiAdmin/:state",isAdmin,function(req,res){
    //left outer join Sitisi με SitisiCheck όπου state είναι το ζητούμενο
    findAllby([Sitisi,SitisiCheck],'state',req.params.state,"sitisi_ref").then((data)=>{
        console.log(data);
        if(data.sitisi.length==0) res.redirect("/admin");
        else res.render("sitisiAdmin",{forms:data.sitisi,user:req.user,value:req.params.state})
    })
    .catch(function(err){
        console.log(err)
    });
});
//βρίσκει όλες τις φόρμες
app.get("/sitisiAdmin",isAdmin,function(req,res){
    findAllby([Sitisi,SitisiCheck],'state',req.params.state,"sitisi_ref").then((data)=>{
        console.log(data);
        if(data.sitisi.length==0) res.redirect("/admin");
        else res.render("sitisiAdmin",{forms:data.sitisi,user:req.user,value:"any"})
    })
    .catch(function(err){
        console.log(err)
    });
});
//ξεχωριστά εμφάνιση φόρμας για τον admin ,ώστε να έχει επιλογή απάντησης στην φόρμα
app.get("/sitisiAdminShow/:id",isAdmin,function(req,res){
    findOneBy(Sitisi,"_id",req.params.id).then((form)=>{
        console.log(form);
        if(form==undefined |form==null){
            res.redirect("/sitisiAdmin");
        }
        else if(Object.keys(form).length==0) res.redirect("/sitisiAdmin");
        else {
            findOneBy(SitisiCheck,"sitisi_ref",req.params.id).then((check)=>{
                if(check==undefined | check==null){
                    obj={"state":"PENDING","admin_ref":"","sitisi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_sitisi_admin",{form:form,user:req.user,check:obj})
                }
                else if(Object.keys(check).length==0){
                    obj={"state":"PENDING","admin_ref":"","sitisi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_sitisi_admin",{form:form,user:req.user,check:obj})
                }
                else res.render("show_sitisi_admin",{form:form,user:req.user,check:check})
            });
        }
    })
});

app.post("/sitisiAdmin/:id/response",isAdmin,function(req,res){
 
    SitisiCheck.collection.dropIndex("username_1").catch((err)=>{console.log("already dropped index")})
    req.body.sitisi_ref=ObjectId(req.params.id);
    req.body.admin_ref = ObjectId(req.user._id);
    console.log(req.body);
    //αν δεν έχει doc απάντησης για αυτή τη φόρμα φτιάχνει καινούριο
    if(req.body._id==""){
        delete req.body._id;
        var sitisiCheck_form=new SitisiCheck(req.body);
        sitisiCheck_form.save()
        .then(()=>{
            res.redirect("/sitisiAdminShow/"+req.params.id);
            console.log("Sitisi Check Applied!");
        })
        .catch(function(err){
            console.log(err)}
        );
    }
    //αλλιώς update στο ήδη υπάρχων doc
    else{
        update(SitisiCheck,req.body._id,req.body).then((result)=>{
            console.log(result);
            res.redirect("/sitisiAdminShow/"+req.params.id);
            console.log("Sitisi Check Updated!");
            
            });
    }
});

//admin gia stegasi
app.get("/stegasiAdmin",isAdmin,function(req,res){
    findAllby([Stegasi,StegasiCheck],'state',req.params.state,"stegasi_ref").then((data)=>{
        console.log(data);
        if(data.stegasi.length==0) res.redirect("/admin");
        else res.render("stegasiAdmin",{forms:data.stegasi,user:req.user,value:"any"})
    })
    .catch(function(err){
        console.log(err)
    });
});
app.get("/stegasiAdmin/:state",isAdmin,function(req,res){
    findAllby([Stegasi,StegasiCheck],'state',req.params.state,"stegasi_ref").then((data)=>{
        console.log(data);
        if(data.stegasi.length==0) res.redirect("/admin");
        else res.render("stegasiAdmin",{forms:data.stegasi,user:req.user,value:req.params.state})
    })
    .catch(function(err){
        console.log(err)
    });
});
app.get("/stegasiAdminShow/:id",isAdmin,function(req,res){
    findOneBy(Stegasi,"_id",req.params.id).then((form)=>{
        console.log(form);
        if(form==undefined |form==null){
            res.redirect("/stegasiAdmin");
        }
        else if(Object.keys(form).length==0) res.redirect("/stegasiAdmin");
        else {
            findOneBy(StegasiCheck,"stegasi_ref",req.params.id).then((check)=>{
                if(check==undefined | check==null){
                    obj={"state":"PENDING","admin_ref":"","stegasi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_stegasi_admin",{form:form,user:req.user,check:obj})
                }
                else if(Object.keys(check).length==0){
                    obj={"state":"PENDING","admin_ref":"","stegasi_ref":"","comments":"","lastUpdated":"never"}
                    res.render("show_stegasi_admin",{form:form,user:req.user,check:obj})
                }
                else res.render("show_stegasi_admin",{form:form,user:req.user,check:check})
            });
        }
    })
});
app.post("/stegasiAdmin/:id/response",isAdmin,function(req,res){
    StegasiCheck.collection.dropIndex("username_1").catch((err)=>{console.log("already dropped index")})
    req.body.stegasi_ref=ObjectId(req.params.id);
    req.body.admin_ref = ObjectId(req.user._id);
    console.log(req.body);
    if(req.body._id==""){
        delete req.body._id;
        var stegasiCheck_form=new StegasiCheck(req.body);
        stegasiCheck_form.save()
        .then(()=>{
            res.redirect("/stegasiAdminShow/"+req.params.id);
            console.log("Stegasi Check Applied!");
        })
        .catch(function(err){
            console.log(err)}
        );
    }
    else{
        update(StegasiCheck,req.body._id,req.body).then((result)=>{
            console.log(result);
            res.redirect("/stegasiAdminShow/"+req.params.id);
            console.log("Stegasi Check Updated!");
            
            });
    }
});
//files
//εμφάνιση ζητούμενου αρχείου στο χρήστη με βάση το είδος της φόρμας , το όνομα του  και το id της φόρμας
app.get("/show/:collection/:file/:id",isLoggedIn,function(req,res){
    if(req.params.collection=="Sitisi") col = Sitisi
    else if(req.params.collection=="Stegasi") col  = Stegasi
    findOneBy(col,"_id",req.params.id).then((form)=>{
        if(form==undefined |form==null){
            res.redirect("/sitisi/"+req.params.id);
        }
        if(req.params.file=="ekkatharistiko"){
            try{
            //bits του αρχείου
            buffer = form.ekkatharistiko.file.buffer;
            //όνομα
            fname = form.ekkatharistiko.name;
            //είδος content πχ. image/png
            type = form.ekkatharistiko.type;
            }catch(err){
                console.log("ekkatharistiko de brethike")
            }
        }
        else if(req.params.file=="tautothta"){
            try{
            buffer = form.tautothta.file.buffer;
            fname = form.tautothta.name;
            type = form.tautothta.type;
        }catch(err){
            console.log("tautothta de brethike")
        }
        }
        else{
            try{
            buffer = form.pasofile.file.buffer;
            fname = form.pasofile.name;
            type = form.pasofile.type;
        }catch(err){
            console.log("paso de brethike")
        }
        }
        console.log(type)
        //αποστολή είδους content στο header και αποστολή των bits του αρχείου
        res.contentType(type);
        res.send(buffer);
    })
})

//ελέγχει το session (express-session)
function isLoggedIn(req,res,next){
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        if(req.ip=="::1") ip="localhost"
        else ip=req.ip
        console.log("User with username: "+req.user.username+"  logged in successfully with ip:"+ip);
        return next();
    }
    else{
        res.redirect("/login"+req.originalUrl);
    }
};
//ελέγχει το sesssion και τον ρόλο του χρήστη αν είναι admin από το req.user.role
function isAdmin(req,res,next){
    
    console.log(req.isAuthenticated());
    if(!req.isAuthenticated()) res.redirect("/login"+req.originalUrl);
    else if(req.user.role==="admin"){
        if(req.ip=="::1") ip="localhost"
        else ip=req.ip
        console.log("Admin with username: "+req.user.username+"  logged in successfully with ip:"+ip+" (his current role is "+req.user.role+")");
        return next();
    }
    else{
        if(req.ip=="::1") ip="localhost"
        else ip=req.ip
        console.log("!! User with id: "+req.user._id+" tried to loggin as admin from ip: "+ip+" (his current role is "+req.user.role+") !!");
        res.redirect("/login"+req.originalUrl);
    }
};

app.listen(process.env.PORT || 3000,()=>{
    console.log("Server Started!");
});
//left outer join 2 collections με aggregate pipeline
async function findAllby(collections,field,value,ref){
    query = `{"${collections[1].collection.collectionName}" : {
        "$arrayElemAt": [
            {
                "$filter": {
                    "input": "$${collections[1].collection.collectionName}",
                    "as": "check",
                    "cond": {
                        "$eq": [ "$$check.${field}", "${value}" ]
                    }
                }
            }, 0
        ]
    }}`
    query = JSON.parse(query);
    console.log(query)
    res={};
    const cursor =collections[0].aggregate([{
        $lookup: {
            from: collections[1].collection.collectionName, 
            localField: "_id",
            foreignField: ref,
            as: collections[1].collection.collectionName
        }
    }
    ]);
    let data=new Array();
    for await(const doc of cursor) {
        console.log(doc);
         data.push(doc);
    }
    res[collections[0].collection.collectionName] = data;
    
      return res;
};
async function update(collection,id,data){
    collection.findByIdAndUpdate(id,data,function(err,result){
        if(err){
            console.log(err);
        }
        else return result;
    });
};

async function findOneBy(collection,field,value){
    query = `{ "${field}" : "${value}"}`
    
    query = JSON.parse(query);
    console.log(query)
    const cursor =collection.find(query);
    
    for await(const doc of cursor) {
        return doc
    }
    

}



function refactorAdresses(data){
    obj1 = {};
    obj1.street =   data.permadressStreet;
    obj1.number =   data.permadressNumber;
    obj1.city =   data.permadressCity;
    obj1.region =   data.permadressRegion;
    obj1.division =   data.permadressDivision;
    data.permadress = obj1;
    delete  data.permadressStreet;
    delete  data.permadressNumber;
    delete  data.permadressCity;
    delete  data.permadressRegion;
    delete data.permadressDivision;
    
    obj2 = {};
    obj2.street =   data.tempadressStreet;
    obj2.number =   data.tempadressNumber;
    obj2.city =   data.tempadressCity;
    obj2.region =   data.tempadressRegion;
    obj2.division =   data.tempadressDivision;
    data.tempadress = obj2;
    delete  data.tempadressStreet;
    delete  data.tempadressNumber;
    delete  data.tempadressCity;
    delete  data.tempadressRegion;
    delete  data.tempadressDivision;
    return data;
}