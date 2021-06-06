const { ObjectID } = require("bson");
var mongoose=require("mongoose");

var SitisiSchema=new mongoose.Schema({
    username:String,
    surname:String,
    patronym:String,
    am:Number,
    startyear:Number,
    email:String,
    uni:String,
    kuklos_spoudwn:String,
    barcode:String,
    tempadress:Object,
    permadress:Object,
    phone:String,
    mobile:String,
    sxolia:String,
    user_ref:ObjectID,
    tautothta:Object,
    ekkatharistiko:Object,
    pasofile:Object
},
{
    collection:'sitisi'
});

module.exports=mongoose.model("Sitisi",SitisiSchema);
