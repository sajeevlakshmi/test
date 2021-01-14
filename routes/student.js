var express = require('express');
var router = express.Router();
const teacherHelpers = require('../helpers/teacher-helpers')
const studentHelpers = require('../helpers/student-helpers');
const { ObjectID } = require('mongodb');
const paypal = require('paypal-rest-sdk');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



const https = require("https");
const qs = require("querystring");

const checksum_lib = require('../paytm/checksum')
const config = require('../paytm/config');

const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
 let amount=""
 let eventId=""
 
 let paytmAmount=""
 let PayeventId=""


/* GET users listing. */
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AelCHzYylKXPf6BmgQ-8co0kMsMvt9p3FI5f0qV2tf6o7P1-lnP1ExIEL3pjTCCgA3tpZ86tn0kf9Hbp',
  'client_secret': 'EN48YcYXc_U9Ffjq1KbfAgGWMHRYRodJFHKOeIcjGqlARh99fZmsAanSWx2H09gCA_7WXAZSE2mOVmRH'
});


const redirectStudLogin=(req,res,next)=>{
  if(req.session.studentloggedIn){
    next() 
  }
  else{
    res.redirect('/student/studentLogin') 
  } 
 }
 router.get('/',redirectStudLogin,(req,res,next)=>{
  res.render('student/studentLogin')
})
router.get('/send-otp',redirectStudLogin,(req,res)=>{
  res.render('student/send-otp')
})
 router.post('/send-otp',(req,res)=>{
   let number=req.body.number
   console.log(number)
   studentHelpers.sendOtp(req.body.number).then((response)=>{
     let otp_id=response.otp_id;
     
     console.log(otp_id)
     if(response.status){
     res.render('student/verify-otp',{otp_id,number})
     }
     else{
       let otpError="Number is not registered"
       console.log(otpError)
       res.render('student/send-otp',{otpError})
         }

   })
 })
 router.get('/verify-otp',redirectStudLogin,(req,res)=>{
   res.render('student/verify-otp')
 })
router.post('/verify-otp',redirectStudLogin,(req,res)=>{
 let otp=req.body.otp
  let otp_id=req.body.otp_id
  let phone=req.body.phone
  studentHelpers.verifyOtp(otp,otp_id).then((response)=>{
    console.log(response)
    if(response.status=='success')
    {
       console.log("number verified")
       studentHelpers.otpLogin(phone).then((student)=>{
          req.session.loggedIn = true
          req.session.user=student
         
          res.redirect('/student/student_home')    
       
       })
    }
   else{
    console.log("resend otp")
    let otpError="Invalid  OTP"
    res.render('student/verify-otp',{otpError})
   }
  })
})
router.post('/resend-otp/:otp_id',(req,res)=>{
  let otp_id=req.body.otp_id
  studentHelpers.resendOtp(otp_id).then((response)=>{
    res.render('student/verify-otp')

  })

})
router.get('/studentLogin',(req,res)=>{
  if (req.session.studentloggedIn) {
    res.render('student/student_home', {student:true, user })
  } else {
    let loginErr = req.session.loginErr
    res.render('student/studentLogin', { loginErr })
    req.session.loginErr = false
  }
})

router.post('/studentLogin',(req,res)=>{
  studentHelpers.doLogin(req.body).then((response) => {
    if (response.status) {

     
      req.session.student = response.user
      req.session.studentloggedIn = true
      let user = req.session.student
      console.log(req.session.student)
      res.redirect('/student/student_home')
    }
    else {
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/student/studentLogin')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.student=null
  req.session.studentloggedIn = false

  res.redirect('/')
})
router.get('/student_assignments',redirectStudLogin,(req,res)=>{
  userId=req.session.student._id
  teacherHelpers.getAsssignments().then((assignments)=>{
    res.render('student/student_assignments', { student: true,assignments,userId})  
    
  })
})
router.post('/student_assignments',redirectStudLogin,(req,res)=>{
  userId=req.session.student._id
  let fileName=req.files.pdf.name
  console.log(fileName)
  studentHelpers.postAssignments(req.body,fileName,userId).then((data)=>{
    let name=req.body.name
    let pdf=req.files.pdf
   
    pdf.mv('./public/assign_submitted/'+userId+fileName+'.pdf',(err,done)=>{
      if(!err){
        
        res.redirect('/student/student_assignments')
      }
      else{
        console.log(err)
      }
    })    
  })
})
router.get('/student/subAssignments/:id/:name',redirectStudLogin,(req,res)=>{
  let id=req.params.id
  let name=req.params.name
  console.log(id)
  res.render('student/subAssignView',{id,name})
})
router.get('/student_notes',redirectStudLogin,(req,res)=>{
  teacherHelpers.getNotes().then((notes)=>{
    res.render('student/student_notes', { student: true,notes })
  })

})
router.get('/today_task',redirectStudLogin,(req,res)=>{
  studentHelpers.todayAssignment().then((assignments)=>{
    res.render('student/today_task',{student:true,assignments})
  })

})
router.get('/student_profile',redirectStudLogin,(req,res)=>{
  let studentId=req.session.student._id
  studentHelpers.getStudentProfile(studentId).then((student)=>{
    res.render('student/student_profile',{student:true,student})
  })
})
router.get('/student_home',redirectStudLogin, async(req, res) => {
  await teacherHelpers.getAnouncements().then((anouncements)=>{
    teacherHelpers.getEvent ().then((events)=>{
    res.render('student/student_home', { student:true,anouncements,events })

   })
    //console.log("reached student home")
    //console.log(anouncements)
  
  })

})
router.get('/student_anouncements',redirectStudLogin,(req,res)=>{
  teacherHelpers.getAnouncements().then((anouncements)=>{
    res.render('student/student_anouncements',{student:true,anouncements})
})
})
router.get('/anouncements-details/:id',redirectStudLogin,(req,res)=>{

  teacherHelpers.getAnouncementsDetails(req.params.id).then((details)=>{
    res.render('student/stud_anouncements_details',{student:true,details})

  })
})
router.get('/anouncementView/:id/:name',redirectStudLogin,(req,res)=>{
  let id=req.params.id
  let name=req.params.name
  console.log(id)
  console.log(name)
  res.render('student/announceView_pdf',{id,name})
})
router.get('/attentance',redirectStudLogin,(req,res)=>{
    
  let studentId=req.session.student._id
  console.log(studentId)
  studentHelpers.addAttentance(studentId).then((response)=>{
    res.json({response})
  })
 
})
router.get('/student_events/:id',redirectStudLogin,(req,res)=>{
  teacherHelpers.getEventDetails(req.params.id).then((details)=>{
    res.render('student/student_events',{student:true,details})

  })
})
router.get('/event_register/:id',redirectStudLogin,(req,res)=>{
  let studId=req.session.student._id
  teacherHelpers.getEventDetails(req.params.id).then((details)=>{
    studentHelpers.getStudentProfile(studId).then((student)=>{
     // console.log(student)
     if(details.fees)
      res.render('student/event_register',{student:true,details,student})
      else{
        res.render('student/register-success',{student:true})
      }
     
    })

   

  })
})
router.post('/event_register',redirectStudLogin,(req,res)=>{
  console.log(req.body)
  let fees=req.body.fees *100
  console.log(fees)
studentHelpers.eventRegistration(req.body).then((eventId)=>{
 // if(req.body['payment-mode']=='razorpay')
  
    studentHelpers.generateRazorpay(eventId,fees).then((response)=>{
      res.json({response})

    })
  
 
})
  
})
router.post('/verify-payment',redirectStudLogin,(req,res)=>{
  console.log("payment_details:",req.body)
  studentHelpers.verifyPayment(req.body).then((response)=>{
    console.log("receipt",req.body['order[response][receipt]'])
    studentHelpers.changePaymentStatus(req.body['order[response][receipt]']).then((response)=>{
      console.log("payment Successful")
      res.json({status:true})
  
    })
    }).catch((err)=>{
      console.log(err)
      res.json({status:false})
   
  })          
})
router.get('/paytmtest/:id',redirectStudLogin,(req,res)=>{
  let studId=req.session.student._id
  teacherHelpers.getEventDetails(req.params.id).then((details)=>{
    studentHelpers.getStudentProfile(studId).then((student)=>{
     // console.log(student)
      //console.log(details)
      res.render('student/paytmtest',{student:true,details,student})
    })  
  })
})
router.get('/paypaltest/:id',redirectStudLogin,(req,res)=>{
  let studId=req.session.student._id
console.log("eventId:",req.params.id)
  teacherHelpers.getEventDetails(req.params.id).then((details)=>{
    studentHelpers.getStudentProfile(studId).then((student)=>{
     // console.log(student)
      console.log(details)
      res.render('student/paypal_test',{student:true,details,student})
    })  
  })
})
router.post('/paypal_pay',redirectStudLogin, (req, res) => {
  console.log(req.body)
   amount=req.body.fees
   studentHelpers.eventRegistration(req.body).then((response)=>{
    eventId=response
    console.log(eventId)
   })
  const create_payment_json = {
    
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "https://elearning-web.com/student/success",
        "cancel_url": "https://elearning-web.com/student/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Red Sox Hat",
                "sku": "001",
                "price": amount,
                "currency": "INR",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "INR",
            "total": amount
        },
        "description": "Hat for the best team ever"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});
router.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
console.log("paymentdetails:",req.query)
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "INR",
            "total": amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        console.log(eventId)
       studentHelpers.changePaymentStatus(eventId).then((response)=>{
        res.render('student/register-success',{student:true})
       })
       
    }
});
});
router.get('/cancel', (req, res) =>{
  res.send('Cancelled')

})
router.post('/paynow',redirectStudLogin, [parseUrl, parseJson], (req, res) => {
  
  paytmAmount=req.body.fees
  studentHelpers.eventRegistration(req.body).then((response)=>{
   PayeventId=response
   console.log(eventId)
  })
  // Route for making payment
  console.log(req.body)

  var paymentDetails = {
    amount: req.body.fees,
    customerId: req.body.name,
    customerEmail: req.body.email,
    customerPhone: req.body.phone
}
if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
    res.status(400).send('Payment failed')
} else {
    var params = {};
    params['MID'] = config.PaytmConfig.mid;
    params['WEBSITE'] = config.PaytmConfig.website;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CALLBACK_URL'] = 'https://elearning-web.com/student/callback';
    params['EMAIL'] = paymentDetails.customerEmail;
    params['MOBILE_NO'] = paymentDetails.customerPhone;


    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    });
}
});


router.get('/student_attentance',redirectStudLogin,(req,res)=>{
    
    res.render('student/student_attentance',{student:true})
 
})
router.post('/student_attentance',redirectStudLogin,(req,res)=>{
  console.log("ajax call")
  let studentId=req.session.student._id
  let date=req.body.date
  console.log(date)
  studentHelpers.getAttentanceDetails(studentId,date).then((response)=>{
       console.log(response)
    res.json({array:response})
  })

})
router.get('/school_photos',redirectStudLogin,(req,res)=>{
  teacherHelpers.getSchoolPhotos().then((photos)=>{
    res.render('student/school_photos',{student:true,photos})
  }) 
  })
  router.get('/register_success',(req,res)=>{

    res.render('student/register-success',{student:true})
  })
  router.get('/registration_failed',(req,res)=>{

    res.render('student/registration_failed',{student:true})
  })
  router.post('/paypal-register',redirectStudLogin,(req,res)=>{
   
    console.log(req.body)
    studentHelpers.eventRegistration(req.body).then((response)=>{
     res.json(response)
    })
  })
  router.post("/callback", redirectStudLogin,(req, res) => {
    // Route for verifiying payment
    var body = '';
  
    req.on('data', function (data) {
      console.log("hai")
       body += data;
    });
  console.log("checksumhash")
    // req.on('end', function () {
       var html = "";
       var post_data = req.body;
   
       // received params in callback
       console.log('Callback Response: ', post_data, "\n");
  
  
       // verify the checksum
       var checksumhash = post_data.CHECKSUMHASH;
       console.log(checksumhash)
       // delete post_data.CHECKSUMHASH;
       var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
       console.log("Checksum Result => ", result, "\n");
  
  
       // Send Server-to-Server request to verify Order Status
       var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};
  
       checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
         params.CHECKSUMHASH = checksum;
         post_data = 'JsonData='+JSON.stringify(params);
  
         var options = {
           hostname: 'securegw-stage.paytm.in', // for staging
           // hostname: 'securegw.paytm.in', // for production
           port: 443,
           path: '/merchant-status/getTxnStatus',
           method: 'POST',
           headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Content-Length': post_data.length
           }
         };
  
  
         // Set up the request
         var response = "";
         var post_req = https.request(options, function(post_res) {
           post_res.on('data', function (chunk) {
             response += chunk;
           });
  
           post_res.on('end', function(){
             console.log('S2S Response: ', response, "\n");
  
             var _result = JSON.parse(response);
               if(_result.STATUS == 'TXN_SUCCESS') {
                studentHelpers.changePaymentStatus(PayeventId).then((response)=>{
                  res.render('student/register-success',{student:true})
                 })
                res.render('student/register-success',{student:true})
               }else {
                   res.redirect('/student/registration_failed')
               }
             });
         });
  
         // post the data
         post_req.write(post_data);
         post_req.end();
        });
      // });
  });



module.exports = router;
