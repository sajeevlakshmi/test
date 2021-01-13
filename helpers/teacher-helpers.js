var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { STUDENT_COLLECTION } = require('../config/collection')
const cookieParser = require('cookie-parser')
var objectId=require('mongodb').ObjectID
module.exports={
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            console.log(userData)
            
    
          let user= await db.get().collection(collection.TEACHER_COLLECTION).findOne({email:userData.email})
                            
                  
            if(user){
                      if(user.password==userData.password)
                      {
                        console.log("success")
                        response.user=user
                        response.status=true
                        resolve(response)                  
                      }
                      else{
                        console.log("login failed")
                        resolve({status:false})
                      }     
                
            }
            else{
                console.log("login failed")
                resolve({status:false})
            }     
                           
    
        })
    },
    getTeacherProfile:()=>{
      return new Promise(async(resolve,reject)=>{
        let details= await db.get().collection(collection.TEACHER_PROFILE).find().toArray()
          resolve(details)

    })
  },
  updateTeacherProfile:function(teacherId,teacherDetails){

    return new Promise((resolve,reject)=>{
      
      db.get().collection(collection.TEACHER_PROFILE)
      .updateOne({_id:objectId(teacherId)},{
         $set:{
             name:teacherDetails.name,
             job:teacherDetails.job,
             class:teacherDetails.class,
             address:teacherDetails.address,
             mobile:teacherDetails.mobile,
             email:teacherDetails.email
             
         },
        
     }).then((data)=>{
       
         resolve(data)
     })
 })

  },
  addStudent:(student,callback)=>{
         db.get().collection(collection.STUDENT).insertOne(student).then((data)=>{
        callback(data.ops[0]._id) 

    })
   
  },
  addPhotos:(photos,callback)=>{
   /* let photoObj={
      photoname:photos.filename
    }*/
    db.get().collection(collection.PHOTOS).insertOne(photos).then((data)=>{
      callback(data.ops[0]._id) 

  })
  },
  getSchoolPhotos:()=>{
    return new Promise(async(resolve,reject)=>{
      let photos= await db.get().collection(collection.PHOTOS).find().toArray()
      resolve(photos)
    })

  },
  getEvent:()=>{
    return new Promise(async(resolve,reject)=>{
      let events= await db.get().collection(collection.EVENTS).find().toArray()
      resolve(events)
    })

  },
  getAllStudents:()=>{
    return new Promise(async(resolve,reject)=>{
      let students= await db.get().collection(collection.STUDENT).find().toArray()
      resolve(students)
    })
  }, 

  getStudentDetails:(studentId)=>{
    return new Promise((resolve,reject)=>{
      let student=db.get().collection(collection.STUDENT).findOne({_id:objectId(studentId)})
      resolve(student)
    })
  },
/*  absenteesList:(sdate)=>{
    return new Promise(async(resolve,reject)=>{
     let students=await db.get().collection(collection.STUDENT).aggregate([
        {$match:{attendence:{$nin:[sdate] }}},
         { $project: { name: 1, _id: 0 ,rollno:1,status:"Ab"} },
     { $union: { coll: "STUDENT", pipeline: [{$match:{attendence:{$in:[sdate] }} },
     { $project: { name: 1, _id: 0 ,rollno:1,status:"P" } } ]} },
     {$sort:{rollno:1}}
        ]).toArray()
       resolve(students)
       })
      
  },*/
  attentanceList:(sdate)=>{
      let array=[]  
    return new Promise(async(resolve,reject)=>{
      let Pstudents= await db.get().collection(collection.STUDENT).find({attentance:{$in:[sdate]} }).toArray()
      Pstudents.forEach(element => {
        let copyItems={}
        console.log(element.rollno)
       copyItems.rollno=element.rollno
      copyItems.name=element.name
        copyItems.status="P"
        array.push(copyItems)  
      }); 
      let Astudents= await db.get().collection(collection.STUDENT).find({attentance:{$nin:[sdate]} }).toArray()
        Astudents.forEach(element => {
          let copyItems={}
         copyItems.rollno=element.rollno
        copyItems.name=element.name
        copyItems.status="A"
        array.push(copyItems)
      }); 
    array.sort((a, b) => {
        return a.rollno - b.rollno;
    });   
     console.log(array)
      resolve(array)
    })
  },

  updateStudent:(studentId,studentDetails)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.STUDENT).updateOne({_id:objectId(studentId)},
      {
        $set:{
          rollno:studentDetails.rollno,
          name:studentDetails.name,
          gender:studentDetails.gender,
          
          mobile:studentDetails.mobile,
          email:studentDetails.email,
          password:studentDetails.password,

          address:studentDetails.address
         
      },
        
      }).then((response)=>{
        resolve()
      })
      
    })
  },
  deleteStudents:(studentId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.STUDENT).removeOne({_id:objectId(studentId)}).then((response)=>{
        resolve(response)
      })

      
    })

  },
  addAssignments:(assignments,filename,callback)=>{
    let date= new Date()
    let assignObj={name:assignments.name,
                  filename:filename,
                   dateAdded:date.toDateString()}
    db.get().collection(collection.TEACHER_ASSIGNMENTS).insertOne(assignObj).then((data)=>{
      callback(data.ops[0]._id)
  })

  },
  getAsssignments:()=>{
    return new Promise((resolve,reject)=>{
      let assignments=db.get().collection(collection.TEACHER_ASSIGNMENTS).find().toArray()
      resolve(assignments)
    })
   
  },

  deleteAssignments:(assignId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.TEACHER_ASSIGNMENTS).removeOne({_id:objectId(assignId)}).then((response)=>{
        resolve(response)
      })

      
    })
  },
  addNotes:(Notes,filename,documentname,callback)=>{
    let noteObj={
      name:Notes.name,
      filename:filename,
      documentname:documentname,
      date:new Date()
    }
    
    
    db.get().collection(collection.TEACHER_NOTES).insertOne(noteObj).then((data)=>{
      
      callback(data.ops[0]._id)
  })

},
getNotes:()=>{
  return new Promise((resolve,reject)=>{
    let notes=db.get().collection(collection.TEACHER_NOTES).find().toArray()
    resolve(notes)
  })
},
deleteNotes:(noteId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.TEACHER_NOTES).removeOne({_id:objectId(noteId)}).then((response)=>{
      resolve(response)
    })

    
  })

},
addAnouncements:(announce,fname,dname,iname,callback)=>{
let announceObj={
  message:announce.message,
  description:announce.description,
  filename:fname,
  docName:dname,
  ImgName:iname,
  date:new Date().toDateString()
}
db.get().collection(collection.TEACHER_ANOUNCEMENTS).insertOne(announceObj).then((data)=>{
  console.log(data)
      callback(data.ops[0]._id)

})
},
updateAnouncements:(announce,fname,dname,iname,anounId)=>{
return new Promise((resolve,reject)=>{
  db.get().collection(collection.TEACHER_ANOUNCEMENTS).updateOne({_id:objectId(anounId)},
 {
   $set:{
     message:announce.message,
     description:announce.description,
     filename:fname,
     docName:dname,
     ImgName:iname,
     date:new Date().toDateString()

   }
 }).then((response)=>{
   resolve()
 })
  
})
},
getAnouncements:()=>{
  return new Promise(async(resolve,reject)=>{
    let anouncements= await db.get().collection(collection.TEACHER_ANOUNCEMENTS).find().toArray()
   // console.log("entered function")
  
    resolve(anouncements)
  })
  
},
getAnouncementsDetails:(id)=>{
  return new Promise((resolve,reject)=>{
    let details=db.get().collection(collection.TEACHER_ANOUNCEMENTS).findOne({_id:objectId(id)})
    resolve(details)
  })
},
addEvents:(events,fname,dname,iname)=>{
  let eventObj={
    event:events.event,
  topic:events.topic,
  conduct:events.conduct,
  filename:fname,
  docName:dname,
  ImgName:iname,
  date:events.date,
  fees:events.fees

  }
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.EVENTS).insertOne(eventObj).then((data)=>{
      resolve(data.ops[0]._id)
    })

  })

},
getEventDetails:(eventId)=>{
return new Promise(async(resolve,reject)=>{
  let details=await db.get().collection(collection.EVENTS).findOne({_id:objectId(eventId)})
  console.log("details: ",details)
  resolve(details)
})

},
fetchEventDetails:()=>{
 return new Promise((resolve,reject)=>{
  let details= db.get().collection(collection.EVENT_REGISTER).find({status:"registered"}).toArray()
  resolve(details)
 })
},

submitAjax:(details)=>{
  console.log("########")
  console.log("details:",details)
  return new Promise(async(resolve,reject)=>{
    await db.get().collection(collection.AJAX).insertOne(details).then((response)=>{
      console.log(response)

      resolve({status:tr})
    })
  })
}

}
