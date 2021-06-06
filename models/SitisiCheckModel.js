const { ObjectId } = require("bson");
var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var SitisiCheckSchema=new mongoose.Schema({
    state:{type:String,default:"PENDING"},
    admin_ref:ObjectId,
    sitisi_ref:ObjectId,
    comments:String,
    lastUpdated:String
},
{
    colection:"elegxosSitisis"
});
SitisiCheckSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("SitisiCheck",SitisiCheckSchema);