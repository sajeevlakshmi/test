const mongoClient=require('mongodb').MongoClient
const state={db:null}

module.exports.connect=function(done){
     const url ='mongodb://localhost:27017'
    // const url='mongodb+srv://eclass:krhrttj5PZ@3.@a@elearning.b3fkm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
    const dbname='classroom'
    mongoClient.connect(url,{ useUnifiedTopology: true },(err,data)=>{
        if(err)
        return done(err)
        state.db=data.db(dbname)
        done()
    })
   
    
}
module.exports.get=function(){
    return state.db
}