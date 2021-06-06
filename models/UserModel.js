const { ObjectId } = require("bson");
var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    name:String,
    surname:String,
    startyear:Number,
    email:String,
    logStatus:{type:String,default:"OFFLINE"},
    am:Number,
    role:{type:String,default:"user"}
},
{
    colection:"user"
});
UserSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",UserSchema);