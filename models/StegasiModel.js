const { ObjectID } = require("bson");
var mongoose=require("mongoose");

var StegasiSchema=new mongoose.Schema({
    startyear:Number,
    am:String,
    email:String,
    username:String,
    surname:String,
    patronym:String,
    uni:String,
    adt:String,
    kuklos_spoudwn:String,
    barcode:String,
    tempadress:Object,
    permadress:Object,
    phone:String,
    mobile:String,
    sxolia:String,
    user_ref:ObjectID,
    fam_members:Number,
    fjob:String,
    mjob:String,
    sjob:String,
    fincome:String,
    mincome:String,
    sincome:String,
    f3income:String,
    m3income:String,
    s3income:String,
    poluteknh:{type:String, default:"off"},
    orphan1:{type:String, default:"off"},
    parspecialneeds:{type:String, default:"off"},
    famemberspecialneeds:{type:String, default:"off"},
    siblingstudy:{type:String, default:"off"},
    siblingarmy:{type:String, default:"off"},
    divorcedparents:{type:String, default:"off"},
    tautothta:Object,
    ekkatharistiko:Object,
    pasofile:Object
},
{
    collection:'stegasi'
});

module.exports=mongoose.model("Stegasi",StegasiSchema);
