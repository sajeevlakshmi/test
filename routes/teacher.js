var express = require('express');
var router = express.Router();

var request = require('request');
var Buffer = require('buffer/').Buffer
const fs = require('fs')

const teacherHelpers = require('../helpers/teacher-helpers')
const studentHelpers = require('../helpers/student-helpers');
const { ObjectID } = require('mongodb');


const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()

  }
  else {
    res.redirect('/teacher')
  }

}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index')
})

router.get('/teacher', (req, res) => {
  let loginErr = req.session.loginErr
  res.render('teacher/teacherLogin', { loginErr })
  req.session.loginErr = false

})
router.get('/teacher_home',verifyLogin, async (req, res) => {
  await teacherHelpers.getAnouncements().then((anouncements) => {
       teacherHelpers.getEvent().then((events)=>{
         console.log(events)
        res.render('teacher/teacher_home', { teacher: true, anouncements ,events})
       })
  })

})


router.get('/teacher/students/:id',verifyLogin, (req, res) => {
  studentHelpers.getSubAsssignments(req.params.id).then((subAssign) => {
    studentHelpers.getWeekAttentance(req.params.id).then((attentance)=>{
     res.render('teacher/students_subAssignments', { teacher: true, subAssign,attentance})
    })
    
  })
})


router.post('/login', (req, res) => {
  teacherHelpers.doLogin(req.body).then((response) => {
    //console.log(req.session)
    if (response.status) {
     
      req.session.user = response.user
      req.session.loggedIn = true
      let user = req.session.user
      console.log(req.session.user)
      res.redirect('/teacher_home')
    }
    else {
      req.session.loginErr = "Invalid Username or Password"

      res.redirect('/teacher')
    }
  })

})
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.loggedIn = false

  res.redirect('/')
})


router.get('/teacher_attentanceview',verifyLogin ,async (req, res) => {
  await teacherHelpers.getAllStudents().then((students) => {
    res.render('teacher/teacher_attentanceview', { teacher: true, students })
  })
})

router.get('/teacher_profile',verifyLogin, async function (req, res) {
  await teacherHelpers.getTeacherProfile().then((details) => {
    res.render('teacher/teacher_profile', { teacher: true, details })
  })
})

router.post('/teacher/teacher_Profile',verifyLogin, async (req, res) => {
  await teacherHelpers.getTeacherProfile().then((details) => {
    res.render('teacher/teacher_editProfile', { teacher: true, details })
  })
})

router.post('/teacher/teacher_editProfile/:id',verifyLogin, async (req, res) => {
  console.log(req.params.id)
  let id = req.params.id
  await teacherHelpers.updateTeacherProfile(req.params.id, req.body).then((data) => {
    
    if (req.files) {
      let image = req.files.image
      image.mv('./public/profile_image/' + id + '.jpg', (err, done) => {
        if (!err) {
          res.redirect('/teacher_profile')
        }
        else {
          console.log(err)
        }

      })
    }
    res.redirect('/teacher_profile')

  })
})



router.get('/teacher_studentsView',verifyLogin, async (req, res) => {
  await teacherHelpers.getAllStudents().then((students) => {
    res.render('teacher/teacher_studentsView', { teacher: true, students })
  })
})

router.get('/teacher/add-students',verifyLogin, (req, res) => {
  res.render('teacher/teacher_addStudents', { teacher: true })
})

router.post('/teacher/add-students',verifyLogin, (req, res) => {
  let image = req.files.image
  teacherHelpers.addStudent(req.body, (id) => {

    image.mv('./public/images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/teacher_studentsView')
      }
      else {
        console.log(err)
      }

    })
  })
})
router.get('/teacher_photos',verifyLogin, (req, res) => {
  res.render('teacher/teacher_photos', { teacher: true })
})
router.post('/teacher_photos',verifyLogin, (req, res) => {

  console.log(req.body)
  teacherHelpers.addPhotos(req.body, (id) => {
    console.log(id)
    let data = req.body.image
    let image1 = data.split(';')[1]
    let image2 = image1.split(",")[1]
    data = Buffer.from(image2, 'base64');

    fs.writeFileSync('./public/photos/' + id + '.png', data)

    res.json(data)
  })

})


router.get('/teacher/edit-students/:id',verifyLogin, (req, res) => {
  teacherHelpers.getStudentDetails(req.params.id).then((student) => {
    res.render('teacher/t_editStudent', { teacher: true, student })
  })
})


router.post('/teacher/edit-students/:id',verifyLogin, (req, res) => {
  
  //let image = req.files.image
  let id = req.params.id
  teacherHelpers.updateStudent(req.params.id, req.body).then((response) => {
    if(req.files){
      let image = req.files.image 
    image.mv('./public/images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/teacher_studentsView')
      }
      else {
        console.log(err)
      }

    })
  }
  res.redirect('/teacher_studentsView')

  })
})

router.get('/teacher/delete-students/:id',verifyLogin, (req, res) => {
  teacherHelpers.deleteStudents(req.params.id).then((response) => {
    res.redirect('/teacher_studentsView')
  })
})

router.get('/teacher/delete-assignments/:id',verifyLogin, async (req, res) => {
  console.log("hello")
  await teacherHelpers.deleteAssignments(req.params.id).then((response) => {
    res.redirect('/teacher_assignments')
  })
})
router.get('/teacher_assignments', verifyLogin,(req, res) => {
  teacherHelpers.getAsssignments().then((assignments) => {
    res.render('teacher/teacher_assignments', { teacher: true, assignments })
  })

})
router.post('/teacher_assignments',verifyLogin, (req, res) => {
  let pdf = req.files.pdf
  let filename = pdf.name
  teacherHelpers.addAssignments(req.body, filename, (id) => {

    pdf.mv('./public/assignments/' + id + filename + '.pdf')
    console.log(id)
    res.json(id)
  })
})
     


router.get('/teacher/assignments/:id/:name',verifyLogin, (req, res) => {
  let id = req.params.id
  let name = req.params.name
  console.log(id)
  res.render('teacher/view_pdf', { id, name })
})

router.get('/teacher_anouncements',verifyLogin, (req, res) => {
  res.render('teacher/teacher_anouncements', { teacher: true })
})
router.post('/teacher_anouncements', (req, res) => {
  let document = req.files.document
  let documentName = document.name
  let video = req.files.video
  let filename = video.name
  let image = req.files.image
  let imageName = image.name
  console.log(video)
  console.log(image)
  console.log(document)
  teacherHelpers.addAnouncements(req.body, filename, documentName, imageName, (id) => {

    video.mv('./public/video/' + id + filename + '.mp4', (err, done) => {
      if (!err) {
        document.mv('./public/document/' + id + documentName + '.pdf', (err, done) => {
          if (!err) {
            image.mv('./public/images/' + id + imageName + '.jpg', (err, done) => {
              if (!err) {
                res.redirect('/teacher_anouncements')
              }
              else {
                console.log(err)
              }

            })

          }
          else {
            console.log(err)
          }

        })

      }
      else {
        console.log(err)
      }

    })

  })

})
router.get('/anouncements-details/:id',verifyLogin, (req, res) => {

  teacherHelpers.getAnouncementsDetails(req.params.id).then((details) => {
    res.render('teacher/anouncements_details', { teacher: true, details })

  })
})
router.post('/anouncements-update/:id',verifyLogin, (req, res) => {
  let document = req.files.document
  let documentName = document.name
  let video = req.files.video
  let filename = video.name
  let image = req.files.image
  let imageName = image.name
  let id = req.params.id
  teacherHelpers.updateAnouncements(req.body, filename, documentName, imageName, id).then((data) => {

    video.mv('./public/video/' + id + filename + '.mp4', (err, done) => {
      if (!err) {
        document.mv('./public/document/' + id + documentName + '.pdf', (err, done) => {
          if (!err) {
            image.mv('./public/images/' + id + imageName + '.jpg', (err, done) => {
              if (!err) {
                res.redirect('/teacher_home')
              }
              else {
                console.log(err)
              }

            })

          }
          else {
            console.log(err)
          }

        })

      }
      else {
        console.log(err)
      }

    })

  })


})

router.get('/teacher_notes', verifyLogin,(req, res) => {
  teacherHelpers.getNotes().then((notes) => {
    res.render('teacher/teacher_notes', { teacher: true, notes })
  })

})
router.post('/teacher_notes',verifyLogin, (req, res) => {
  let document = req.files.document
  let documentName = document.name
  let video = req.files.video
  let filename = video.name
  console.log(video)
  teacherHelpers.addNotes(req.body, filename, documentName, (id) => {

    video.mv('./public/video/' + id + filename + '.mp4', (err, done) => {
      if (!err) {
        document.mv('./public/document/' + id + documentName + '.pdf', (err, done) => {
          if (!err) {

            res.redirect('/teacher_notes')
          }
          else {
            console.log(err)
          }

        })

      }
      else {
        console.log(err)
      }

    })

  })

})
router.get('/teacher/notes/:id/:name', verifyLogin,(req, res) => {
  let id = req.params.id
  let name = req.params.name
  console.log(id)
  res.render('teacher/viewNotes_pdf', { id, name })
})
router.get('/teacher/delete-notes/:id', async (req, res) => {
  console.log("hello")
  await teacherHelpers.deleteNotes(req.params.id).then((response) => {
    res.redirect('/teacher_Notes')
  })
})

router.post('/absent-students', verifyLogin,(req, res) => {
  teacherHelpers.attentanceList(req.body.date).then((response) => {
    res.json({ students: response })
  })
})
router.get('/teacher_events',verifyLogin, (req, res) => {
  res.render('teacher/teacher_events', { teacher: true })
})
router.get('/teacher_eventsView/:id',verifyLogin,(req,res)=>{
  teacherHelpers.getEventDetails(req.params.id).then((details)=>{
    res.render('teacher/teacher_eventsView',{teacher:true,details})

  })
})
router.post('/teacher_events',verifyLogin, (req, res) => {
  let documentName = ""
  let filename = ""
  let imageName = ""

  if(req.files){
    if(req.files.document){
      let document = req.files.document
      documentName = document.name
    }
    if(req.files.video){
      let video = req.files.video
      filename = video.name
    }
    if(req.files.image){
      let image = req.files.image
      imageName = image.name
    }

  }
 
  teacherHelpers.addEvents(req.body, filename, documentName, imageName).then((id) => {
    if (req.files.video) {
      let video = req.files.video
      video.mv('./public/eventVideos/' + id + '.mp4')
    }
    if (req.files.document) {
      let document = req.files.document
      document.mv('./public/eventPdf/' + id + '.pdf')
    }
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/eventImages/' + id + '.jpg')
    }
    res.json(id)

  })
})
router.get('/students_events',verifyLogin,(req,res)=>{
  teacherHelpers.fetchEventDetails().then((details)=>{
    console.log(details)
   res.render('teacher/student_eventRegister',{teacher:true,details})
})
})

router.get('/file-upload', (req, res) => {
  res.render('teacher/ajaxFileupload', { teacher: true })
})
router.post('/file-upload', (req, res) => {
  //  console.log(req.files)
  console.log(req.body)

  console.log("**********")
  teacherHelpers.submitAjax(req.body).then((response) => {
    if (req.files.document) {
      let document = req.files.document
      let documentName = document.name
      document.mv('./public/ajaxLoader/' + documentName + '.pdf')
    }
    console.log(response)
    res.json({ status: true })
    //res.json({status:true})

  })

})
module.exports = router;
