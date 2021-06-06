const { ObjectId } = require("bson");
var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var StegasiCheckSchema=new mongoose.Schema({
    admin_ref:ObjectId,
    stegasi_ref:ObjectId,
    state:{type:String,default:"PENDING"},
    comments:String,
    lastUpdated:String
},
{
    colection:"elegxosStegasis"
});
StegasiCheckSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("StegasiCheck",StegasiCheckSchema);