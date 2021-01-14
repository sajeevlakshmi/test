var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID
var unirest = require('unirest');

const fetch = require('node-fetch');
var FormData = require('form-data');
global.Headers = fetch.Headers;

var fs = require('fs');
const { resolve } = require('path');
const { response } = require('express');
var Razorpay=require('razorpay');
const { ObjectID } = require('mongodb');



var instance = new Razorpay({
  key_id: 'rzp_test_9coaZKRhVqP3Eo',
  key_secret: 'rD4bJv1KMIB5xq41gHKF6YMR',
})

module.exports = {
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false
      let response = {}
      console.log(userData)


      let user = await db.get().collection(collection.STUDENT).findOne({ email: userData.email })


      if (user) {
        if (user.password == userData.password) {
          console.log("success")
          response.user = user
          response.status = true
          resolve(response)
        }
        else {
          console.log("login failed")
          resolve({ status: false })
        }

      }
      else {
        console.log("login failed")
        resolve({ status: false })
      }


    })
  },
  otpLogin: (phone) => {
    return new Promise((resolve, reject) => {
      let student = db.get().collection(collection.STUDENT).findOne({ mobile: phone })
      resolve(student)
    })


  },

  sendOtp: (phone) => {
    return new Promise(async (resolve, reject) => {
      let response = {}
      let student = await db.get().collection(collection.STUDENT).findOne({ mobile: phone })
      console.log(student)
      if (student) {
        var req = unirest('POST', 'https://d7networks.com/api/verifier/send')
          .headers({
            'Authorization': 'Token 3b5f91489e302c464637294bff22414e4d51d639'
          })
          .field('mobile', '91' + phone)
          .field('sender_id', 'SMSINFO')
          .field('message', 'Your otp code is {code}')
          .field('expiry', '900')
          .end(function (res) {
            //if (res.error) throw new Error(res.error);
            console.log("success otp")
            console.log(res.raw_body);
            response.status = true;
            response.otp_id = res.body.otp_id
            resolve(response)

          });
      }
      else {
        resolve({ status: false })

      }
    })
  },
  verifyOtp: (otp, otp_id) => {
    return new Promise((resolve, reject) => {
      var req = unirest('POST', 'https://d7networks.com/api/verifier/verify')
        .headers({
          'Authorization': 'Token 3b5f91489e302c464637294bff22414e4d51d639'
        })
        .field('otp_id', otp_id)
        .field('otp_code', otp)
        .end(function (res) {

          console.log(res.raw_body);

          resolve(res.body)
        });
    })

  },

  resendOtp: (otpId) => {
    return new Promise((resolve, reject) => {
      var unirest = require('unirest');
      var req = unirest('POST', 'https://d7networks.com/api/verifier/resend')
        .headers({
          'Authorization': 'Token 3b5f91489e302c464637294bff22414e4d51d639'
        })
        .field('otp_id', otpId)
        .end(function (res) {

          console.log(res.raw_body);
        });

    })

  },

  postAssignments: (assignments, filename, userId) => {
    let assignObj = {
      AssignId: objectId(userId),
      name: assignments.name,
      filename: filename
    }
    return new Promise(async (resolve, reject) => {


      let student = await db.get().collection(collection.STUDENT).findOne({ _id: objectId(userId) })
      console.log(student)
      console.log(student.assignments)
      if (student.assignments) {
        db.get().collection(collection.STUDENT).updateOne({ _id: objectId(userId) },

          {
            $push: { assignments: assignObj }
          }).then((response) => {

            resolve(response)
          })
      }
      else {
        db.get().collection(collection.STUDENT).updateOne({ _id: objectId(userId) },

          {
            $set: { assignments: [assignObj] }
          }).then((response) => {

            resolve(response)
          })
      }

    })

  },
  getSubAsssignments: (studId) => {
    return new Promise(async (resolve, reject) => {
      let subAssignments = await db.get().collection(collection.STUDENT).findOne({ _id: objectId(studId) })
      console.log(subAssignments)
      resolve(subAssignments)
    })

  },
  todayAssignment: () => {
    return new Promise((resolve, reject) => {
      let date = new Date()
      let assignments = db.get().collection(collection.TEACHER_ASSIGNMENTS).find({ dateAdded: date.toDateString() }).toArray()
      resolve(assignments)
    })
  },
  getStudentProfile: (studId) => {
    return new Promise((resolve, reject) => {
      let student = db.get().collection(collection.STUDENT).findOne({ _id: objectId(studId) })
      resolve(student)
    })

  },
  addAttentance: (studId) => {
    let newDate = new Date()
    let d = new Date().toISOString().split('T')[0]

    console.log(d)


    return new Promise(async (resolve, reject) => {
      let student = await db.get().collection(collection.STUDENT).findOne({ _id: objectId(studId) })
      console.log(student)
      if (student.attentance) {

        console.log(newDate)
        let indexDate = student.attentance.findIndex(attentance => attentance == d)
        console.log(indexDate)
        if (indexDate == -1) {
          db.get().collection(collection.STUDENT).updateOne({ _id: objectId(studId) },
            {
              $push: { attentance: d }
            }).then((response) => {
              resolve(response)
            })
        } else {
          resolve(response)
        }
      }
      else {
        db.get().collection(collection.STUDENT).updateOne({ _id: objectId(studId) },

          {
            $set: { attentance: [d] }
          }).then((response) => {

            resolve(response)
          })
      }

    })

  },
  getWeekAttentance:(studId)=>{
    let array=[]
      let d= new Date()
    let year = d.getFullYear();
    let month = d.getMonth();
    console.log(month)
    console.log(year)
    
    console.log(d)
    var pastDate = new Date().getDate() - 7;
    
    console.log(pastDate)
       return new Promise(async(resolve,reject)=>{
      for (i=1;i<=7;i++){
        check_date = new Date(year, month, pastDate+1).toISOString().split('T')[0]
        console.log("check_date:",check_date)
      let atten={}
      let attentance = await db.get().collection(collection.STUDENT).findOne({ $and: [{ _id: objectId(studId) }, { attentance: { $in: [check_date] } }] })
      if (attentance) {
        atten.no = i;
        atten.date = check_date;
        atten.status = "P"
        array.push(atten)
      }
      else {
        atten.no = i;
        atten.date = check_date;
        atten.status = "A"
        array.push(atten)
      }
      pastDate=pastDate+1
      }
      console.log(array)
      resolve(array)
    })

  },
  getAttentanceDetails: (studId, sdate) => {
    let array = []
    let array2 = []
    console.log("*****" + sdate)
    let d = new Date(sdate)
    let year = d.getFullYear();    
    let month = d.getMonth();
    let j=1
    let count=0
   //  console.log(month)
   // console.log(year)
    var numOfDays = new Date(year, month+1, 0).getDate()
    //let check_date = new Date(d.getFullYear(), month, 2).toISOString().split('T')[0]
    //console.log("checkingdate 1:" + check_date)
    //console.log(numOfDays)
    return new Promise(async (resolve, reject) => {
      for (let i = 2 ; i <= numOfDays+1; i++) {
        check_date = new Date(year, month, i).toISOString().split('T')[0]
        console.log("checkingdate:" + check_date)
        let atten = {}
        let attentance = await db.get().collection(collection.STUDENT).findOne({ $and: [{ _id: objectId(studId) }, { attentance: { $in: [check_date] } }] })
       
        // console.log(attentance)
        if (attentance) {
          atten.no = j;
          atten.date = check_date;
          atten.status = "P"
          count=count+1
          array.push(atten)
        }
        else {
          atten.no = j;
          atten.date = check_date;
          atten.status = "A"
          array.push(atten)
        }
        j=j+1
      }
      console.log(count)
      console.log(numOfDays)
      let percen=(count/numOfDays)*100
      console.log(percen.toFixed(2))
      array2.push(array)
      array2.push(percen.toFixed(2))
      console.log("array2:",array2)
      resolve(array2)

    })
  },
  checkEventRegister:(stdId,event)=>{
    console.log(stdId)
    console.log(event)
    let response={}
    return new Promise(async(resolve,reject)=>{
 let entry= await db.get().collection(collection.EVENT_REGISTER).findOne({ $and: [{ studId: stdId }, { eventName:event },{status:'registered'}] })
 console.log("student registered",entry)
 if(entry){
    response.status=true
    console.log("entry found",response.status)
    resolve(response)
  }
  else{
    response.status=false
    console.log("entry not found",response.status)
    resolve(response)
  }
    })

  },
  eventRegistration: (details) => {
    console.log("registeration:",details)
    let eventObj={
      studName:details.name,
      studEmail:details.email,
      studId:details.studId,
      eventName:details.event,
      payment:details.fees,
      status:"pending" 
      
    }
   
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.EVENT_REGISTER).insertOne(eventObj).then((response) => {
        console.log("event inserted")
        resolve(response.ops[0]._id)
      })
    })

  },

  generateRazorpay:(eventId,fees)=>{

  return new Promise((resolve,reject)=>{
    var options = {
      amount: fees ,  // amount in the smallest currency unit
      currency: "INR",
      receipt: ""+eventId
    };
    instance.orders.create(options, function(err, order) {
      console.log("new order:",order);
      resolve(order)
    });
     
  })
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'rD4bJv1KMIB5xq41gHKF6YMR');
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex');
      if (hmac==details['payment[razorpay_signature]']){
        resolve()
      }
        else {
          reject()
        }

      
    })
  },
  changePaymentStatus:(eventId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.EVENT_REGISTER).updateOne({_id:ObjectID(eventId)},
      {
        $set:{
          status:"registered"
        }
      }).then((response)=>{
        resolve()

      })
      
      
    })

  }


}